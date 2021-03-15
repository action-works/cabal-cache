import * as cache from "@actions/cache";
import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as glob from '@actions/glob';
import * as tc from '@actions/tool-cache';
import * as io from '@actions/io';

import { Events, Inputs, State } from "./constants";
import * as fs from 'fs';
import * as path from 'path';
import * as utils from "./utils/actionUtils";

async function downloadTool(): Promise<string> {
    if (process.platform === 'win32') {
        const cabalCachePath = await tc.downloadTool('https://dl.haskellworks.io/binaries/cabal-cache/1.0.3.0/cabal-cache-x86_64-windows.tar.gz');
        const cabalCacheExtractedFolder = await tc.extractTar(cabalCachePath);
        return cabalCacheExtractedFolder;
    } else if (process.platform === 'darwin') {
        const cabalCachePath = await tc.downloadTool('https://dl.haskellworks.io/binaries/cabal-cache/1.0.3.0/cabal-cache-x86_64-darwin.tar.gz');
        const cabalCacheExtractedFolder = await tc.extractTar(cabalCachePath);
        return cabalCacheExtractedFolder;
    } else if (process.platform === 'linux') {
        const cabalCachePath = await tc.downloadTool('https://dl.haskellworks.io/binaries/cabal-cache/1.0.3.0/cabal-cache-x86_64-linux.tar.gz');
        const cabalCacheExtractedFolder = await tc.extractTar(cabalCachePath);
        return cabalCacheExtractedFolder;
    } else {
        core.setFailed('Download failed');
        throw 'Download failed 2';
    }
}

async function installTool(): Promise<string> {
    const cabalCachePath = await downloadTool();

    core.addPath(cabalCachePath);

    await exec.exec('cabal-cache version');

    return cabalCachePath;
}
async function run(): Promise<void> {
    try {
        if (utils.isGhes()) {
            utils.logWarning("Cache action is not supported on GHES");
            utils.setCacheHitOutput(false);
            return;
        }

        // Validate inputs, this can cause task failure
        if (!utils.isValidEvent()) {
            utils.logWarning(
                `Event Validation Error: The event type ${
                    process.env[Events.Key]
                } is not supported because it's not tied to a branch or tag ref.`
            );
            return;
        }

        const keyPrefix = core.getInput(Inputs.KeyPrefix, { required: true });
        const distDir = core.getInput(Inputs.DistDir, { required: false });
        const distDirOption = distDir != '' ? `--build-path ${distDir}` : '';

        const localArchive = path.join(process.cwd(), '.actions-cabal-cache', keyPrefix);

        core.info(`Local archive: ${localArchive}`);

        await io.mkdirP(localArchive);

        core.saveState(State.CacheLocalArchive, localArchive);
        core.saveState(State.CacheDistDirOption, distDirOption);

        await installTool();

        if (true) {
            await exec.exec(`cabal-cache plan --output-file .actions-cabal-cache/cache-plan.json ${distDirOption}`);

            let cachePlanRaw = await fs.promises.readFile('.actions-cabal-cache/cache-plan.json', 'utf8');

            let cachePlan: string[][] = JSON.parse(cachePlanRaw);

            for await (const cacheSet of cachePlan) {
                for await (const relativeFile of cacheSet) {
                    core.info(`Relative file: ${relativeFile}`);

                    const absoluteFile = path.join(localArchive, relativeFile);

                    try {
                        const cacheKey = await cache.restoreCache(
                            [absoluteFile],
                            relativeFile,
                            [relativeFile]
                        );

                        if (!cacheKey) {
                            core.info(`Cache not found for input key: ${keyPrefix}`);
                        } else {
                            core.info(`Downloaded ${relativeFile}`);
    
                            break;
                        }
                    } catch (error) {
                        if (error.name === cache.ValidationError.name) {
                            throw error;
                        } else {
                            utils.logWarning(error.message);
                        }
                    }
                }
            }

            core.info('Done downloads');

            const globber = await glob.create('.actions-cabal-cache/**/*.tar.gz', {followSymbolicLinks: false});

            core.info(`localArchive: ${localArchive}`);
    
            for await (const file of globber.globGenerator()) {
                core.info(`Verified: ${file}`);
            }
        }

        await exec.exec(`cabal-cache sync-from-archive --archive-uri ${localArchive} ${distDirOption}`);
    } catch (error) {
        utils.setCacheHitOutput(false);
        core.setFailed(error.message);
    }
}

run();

export default run;
