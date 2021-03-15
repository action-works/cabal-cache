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
        const localArchive = core.getState(State.CacheLocalArchive);
        const distDirOption = core.getState(State.CacheDistDirOption);

        core.info('Syncing archive to ${localArchive}');

        await exec.exec(`cabal-cache sync-to-archive --archive-uri ${localArchive} ${distDirOption}`);

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
