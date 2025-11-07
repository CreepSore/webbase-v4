import {EventEmitter} from "events";

import ExecutionContext from "@service/extensions/ExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import ConfigLoader from "@logic/config/ConfigLoader";
import Core from "@extensions/Core";
import ICacheEntry from "./ICacheEntry";
import CacheEntryConfig from "./CacheEntryConfig";
import Cache from "./Cache";
import CallbackCacheEntry from "./CallbackCacheEntry";
import LogBuilder from "../../src/service/logger/LogBuilder";

class CacheConfig {

}

export default class CoreCache implements IExtension {
    static metadata: ExtensionMetadata = {
        name: "Core.Cache",
        version: "1.0.0",
        description: "Caching Module",
        author: "ehdes",
        dependencies: [Core],
    };

    metadata: ExtensionMetadata = CoreCache.metadata;

    config: CacheConfig;
    events: EventEmitter = new EventEmitter();
    cache: Cache = new Cache();

    constructor() {
        this.config = this.loadConfig(true);
    }

    async start(executionContext: ExecutionContext): Promise<void> {
        this.checkConfig();
        if(executionContext.contextType !== "app") {
            return;
        }
    }

    async stop(): Promise<void> {

    }

    createCacheEntry<T>(config: CacheEntryConfig<T>): ICacheEntry<T> {
        return this.cache.getOrCreateCacheEntry(config.key, () => new CallbackCacheEntry(config.key, config.defaultValue)
            .setLogger(new LogBuilder({
                infos: ["Core.Cache"]
            }))
            .setLifetimeMs(config.updateEveryMs)
            .setUpdateCallback(config.updateCallback));
    }

    cacheEntryExists(key: string): boolean {
        return this.cache.cacheEntryExists(key);
    }

    getCacheEntry<T>(key: string): ICacheEntry<T> {
        return this.cache.getCacheEntry<T>(key);
    }

    getCachedInstance<T>(key: string, config: Omit<CacheEntryConfig<T>, "key">): ICacheEntry<T> {
        return this.cache.getOrCreateCacheEntry(key, () => new CallbackCacheEntry(key, config.defaultValue)
            .setLogger(new LogBuilder({
                infos: ["Core.Cache"]
            }))
            .setLifetimeMs(config.updateEveryMs)
            .setUpdateCallback(config.updateCallback));
    }

    getCachedValue<T>(key: string, defaultValue: T): T {
        return this.getCachedValue(key, defaultValue);
    }

    invalidateCache(key: string, updateNow = false): Promise<any> | any {
        const entry = this.cache.getCacheEntry(key);
        if(!entry) {
            return null;
        }

        entry.invalidate();
        if(updateNow) {
            return entry.getValue();
        }

        return null;
    }

    clearCache(): void {
        this.cache.deleteAll();
    }

    private checkConfig(): void {
        if(!this.config) {
            throw new Error(`Config could not be found at [${this.generateConfigNames()[0]}]`);
        }
    }

    private loadConfig(createDefault: boolean = false): typeof this.config {
        const [configPath, templatePath] = this.generateConfigNames();
        return ConfigLoader.initConfigWithModel(
            configPath,
            templatePath,
            new CacheConfig(),
            createDefault,
        );
    }

    private generateConfigNames(): string[] {
        return [
            ConfigLoader.createConfigPath(`${this.metadata.name}.json`),
            ConfigLoader.createTemplateConfigPath(`${this.metadata.name}.json`),
        ];
    }
}
