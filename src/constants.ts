export enum Inputs {
    Key = "key",
    Path = "path",
    RestoreKeys = "restore-keys",
    DistDir = "dist-dir",
    KeyPrefix = "key-prefix",
    StorePath = "store-path",
    UploadChunkSize = "upload-chunk-size"
}

export enum Outputs {
    CacheHit = "cache-hit"
}

export enum State {
    CachePrimaryKey = "CACHE_KEY",
    CacheMatchedKey = "CACHE_RESULT",
    CacheDistDirOption = "DIST_DIR_OPTION",
    CacheLocalArchive = "CACHE_LOCAL_ARCHIVE",
    CacheStorePathOption = "STORE_PATH"
}

export enum Events {
    Key = "GITHUB_EVENT_NAME",
    Push = "push",
    PullRequest = "pull_request"
}

export const RefKey = "GITHUB_REF";
