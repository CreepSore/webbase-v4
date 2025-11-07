import ICache, { CacheEntryBuilderCallback } from "./ICache";
import ICacheEntry from "./ICacheEntry";

export default class Cache implements ICache {
    private _entries: Map<string, ICacheEntry<any>> = new Map();

    cacheEntryExists(key: string): boolean {
        return this._entries.has(key);
    }

    deleteCacheEntry(key: string): boolean {
        return this._entries.delete(key);
    }

    getCacheEntry<T>(key: string): ICacheEntry<T> {
        return this._entries.get(key);
    }

    getOrCreateCacheEntry<T>(key: string, builder: CacheEntryBuilderCallback<T>): ICacheEntry<T> {
        let cacheEntry = this.getCacheEntry<T>(key);
        if(!cacheEntry) {
            cacheEntry = builder();
            this._entries.set(key, cacheEntry);
        }

        return cacheEntry;
    }

    deleteAll(): void {
        this._entries.clear();
    }

    invalidateAll(): void {
        for(const entry of this._entries.values()) {
            entry.invalidate();
        }
    }
}
