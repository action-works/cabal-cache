export enum Inputs {
    KeyPrefix = "key-prefix",
    DistDir = "dist-dir",
    UploadChunkSize = "upload-chunk-size"
}

export enum Outputs {
    CacheHit = "cache-hit"
}

export enum State {
    CacheLocalArchive = "CACHE_LOCAL_ARCHIVE",
    CacheDistDirOption = "DIST_DIR_OPTION",
    CacheMatchedKey = "CACHE_RESULT"
}

export enum Events {
    Key = "GITHUB_EVENT_NAME",
    Push = "push",
    PullRequest = "pull_request"
}

export const RefKey = "GITHUB_REF";
