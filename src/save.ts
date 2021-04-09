import * as cache from "@actions/cache";
import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as glob from '@actions/glob';

import { Events, Inputs, State } from "./constants";
import * as utils from "./utils/actionUtils";
import * as path from 'path';

async function run(): Promise<void> {
    try {
        if (utils.isGhes()) {
            utils.logWarning("Cache action is not supported on GHES");
            return;
        }

        if (!utils.isValidEvent()) {
            utils.logWarning(
                `Event Validation Error: The event type ${
                    process.env[Events.Key]
                } is not supported because it's not tied to a branch or tag ref.`
            );
            return;
        }

        const state = utils.getCacheState();

        // Inputs are re-evaluted before the post action, so we want the original key used for restore
        const primaryKey = core.getState(State.CachePrimaryKey);
        if (!primaryKey) {
            utils.logWarning(`Error retrieving key from state.`);
            return;
        }

        if (utils.isExactKeyMatch(primaryKey, state)) {
            core.info(
                `Cache hit occurred on the primary key ${primaryKey}, not saving cache.`
            );
            return;
        }

        const cachePaths = utils.getInputAsArray(Inputs.Path, {
            required: true
        });

        try {
            await cache.saveCache(cachePaths, primaryKey, {
                uploadChunkSize: utils.getInputAsInt(Inputs.UploadChunkSize)
            });
            core.info(`Cache saved with key: ${primaryKey}`);
        } catch (error) {
            if (error.name === cache.ValidationError.name) {
                throw error;
            } else if (error.name === cache.ReserveCacheError.name) {
                core.info(error.message);
            } else {
                utils.logWarning(error.message);
            }
        }

        const localArchive = core.getState(State.CacheLocalArchive);
        const distDirOption = core.getState(State.CacheDistDirOption);
        const storePathOption = core.getState(State.CacheStorePathOption);

        core.info('Syncing archive to ${localArchive}');

        await exec.exec(`cabal-cache sync-to-archive --archive-uri ${localArchive} ${storePathOption} ${distDirOption}`);

        const globber = await glob.create('.actions-cabal-cache/**/*.tar.gz', {followSymbolicLinks: false});

        for await (const file of globber.globGenerator()) {
            core.info(`File: ${file}`);

            const relativeFile = path.relative(localArchive, file);

            if (utils.isExactKeyMatch(relativeFile, state)) {
                core.info(
                    `Cache hit occurred on the primary key ${relativeFile}, not saving cache.`
                );

                continue;
            }

            try {
                await cache.saveCache([file], relativeFile, {
                    uploadChunkSize: utils.getInputAsInt(Inputs.UploadChunkSize)
                });
            } catch (err) {
                if (err.name === cache.ReserveCacheError.name) {
                  core.warning(err);
                } else {
                  throw err;
                }
            }

            core.info(`Cache saved with key: ${relativeFile}`);
        }

        core.info('Done paths');
    } catch (error) {
        utils.logWarning(error.message);
    }
}

run();

export default run;
