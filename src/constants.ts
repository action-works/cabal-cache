export enum Inputs {
    DistDir = "dist-dir",
    KeyPrefix = "key-prefix",
    StorePath = "store-path",
    UploadChunkSize = "upload-chunk-size",
    HostName = "host-name",
    HostPort = "host-port",
    HostSsl = "host-ssl",
}

export enum Outputs {
    CacheHit = "cache-hit"
}

export enum State {
    CacheDistDirOption = "DIST_DIR_OPTION",
    CacheLocalArchive = "CACHE_LOCAL_ARCHIVE",
    CacheMatchedKey = "CACHE_RESULT",
    CacheStorePathOption = "STORE_PATH",
    CacheHostNameOption = "HOST_NAME",
    CacheHostPortOption = "HOST_PORT",
    CacheHostSslOption = "HOST_SSL",
}

export enum Events {
    Key = "GITHUB_EVENT_NAME",
    Push = "push",
    PullRequest = "pull_request"
}

export const RefKey = "GITHUB_REF";
