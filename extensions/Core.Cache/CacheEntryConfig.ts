export default interface CacheEntryConfig<T> {
    key: string;
    updateCallback: () => Promise<T> | T;
    defaultValue?: T;
    updateEveryMs?: number;
    log?: (level: string, message: string) => any;
}
