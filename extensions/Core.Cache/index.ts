import {EventEmitter} from "events";

import ExecutionContext from "@service/extensions/ExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import ConfigLoader from "@logic/config/ConfigLoader";
import LogBuilder from "@service/logger/LogBuilder";
import Core from "@extensions/Core";
import Cache from "./Cache";
import CacheEntryConfig from "./CacheEntryConfig";
import CacheEntry from "./CacheEntry";

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

    createCacheEntry<T>(config: CacheEntryConfig<T>): CacheEntry<T> {
        return this.cache.createCacheEntry<T>(config);
    }

    cacheEntryExists(key: string): boolean {
        return this.cache.cacheEntryExists(key);
    }

    getCacheEntry<T>(key: string): CacheEntry<T> {
        return this.cache.getCacheEntry<T>(key);
    }

    getCachedInstance<T>(key: string, config: Omit<CacheEntryConfig<T>, "key">): CacheEntry<T> {
        return this.getCachedInstance<T>(key, config);
    }

    getCachedValue<T>(key: string, defaultValue: T): T {
        return this.getCachedValue(key, defaultValue);
    }

    invalidateCache(key: string, updateNow = false): void {
        this.cache.invalidateCache(key, updateNow);
    }

    clearCache(): void {
        this.cache.clearCache();
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
