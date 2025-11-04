import CacheEntry from "./CacheEntry";
import CacheEntryConfig from "./CacheEntryConfig";

export default class Cache {
    private cache: Map<string, CacheEntry<any>> = new Map();

    createCacheEntry<T>(config: CacheEntryConfig<T>): CacheEntry<T> {
        const entry = new CacheEntry<T>(config);
        this.cache.set(entry.key, entry);
        return entry;
    }

    cacheEntryExists(key: string): boolean {
        return this.cache.has(key);
    }

    getCacheEntry<T>(key: string): CacheEntry<T> {
        return this.cache.get(key) as CacheEntry<T>;
    }

    getCachedInstance<T>(key: string, config: Omit<CacheEntryConfig<T>, "key">): CacheEntry<T> {
        if(this.cache.has(key)) return this.getCacheEntry(key);

        return this.createCacheEntry({...config, key});
    }

    getCachedValue<T>(key: string, defaultValue: T): T {
        return (this.getCacheEntry(key)?.currentValue || defaultValue) as T;
    }

    invalidateCache(key: string, updateNow = false): void {
        const entry = this.cache.get(key);
        if(entry) {
            entry.invalidate(updateNow);
        }
    }

    clearCache(): void {
        this.cache.clear();
    }
}
