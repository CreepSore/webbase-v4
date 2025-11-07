import ICacheEntry from "./ICacheEntry";

export type CacheEntryBuilderCallback<T> = () => ICacheEntry<T>;

export default interface ICache {
    getCacheEntry<T>(key: string): ICacheEntry<T>;
    getOrCreateCacheEntry<T>(key: string, builder: CacheEntryBuilderCallback<T>): ICacheEntry<T>;

    cacheEntryExists(key: string): boolean;
    deleteCacheEntry(key: string): boolean;

    invalidateAll(): void;
}
