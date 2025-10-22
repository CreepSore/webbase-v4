import {EventEmitter} from "events";

import ExecutionContext from "@service/extensions/ExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import ConfigLoader from "@logic/config/ConfigLoader";
import LogBuilder from "@service/logger/LogBuilder";
import Core from "@extensions/Core";

class CacheConfig {

}

export interface CacheEntryConfig<T> {
    key: string;
    updateCallback: () => Promise<T> | T;
    defaultValue?: T;
    updateEveryMs?: number;
}

export class CacheEntry<T> {
    key: string;
    currentValue: T;
    defaultValue?: T;
    refreshNextUpdate?: boolean;
    lastUpdate: Date;
    updateEveryMs?: number;
    private updateCallback: () => Promise<T> | T;

    constructor(config: CacheEntryConfig<T>) {
        this.key = config.key;
        this.updateCallback = config.updateCallback;
        this.currentValue = this.defaultValue = config.defaultValue;
        this.lastUpdate = this.defaultValue ? new Date() : new Date(0);
        this.updateEveryMs = config.updateEveryMs;
        this.refreshNextUpdate = !this.defaultValue;
    }

    async getValue(): Promise<T> {
        const timeoutReached = (Date.now() - Number(this.lastUpdate) > this.updateEveryMs);

        if(this.refreshNextUpdate || (this.updateEveryMs > 0 && timeoutReached)) {
            this.refreshNextUpdate = false;
            this.lastUpdate = new Date();

            LogBuilder
                .start()
                .level(LogBuilder.LogLevel.INFO)
                .info("Core.Cache")
                .line(`Executing update-function for cache [${this.key}]`)
                .done();

            this.currentValue = await this.updateCallback();

            LogBuilder
                .start()
                .level(LogBuilder.LogLevel.INFO)
                .info("Core.Cache")
                .line(`Updated value for cache [${this.key}]`)
                .debugObject("newValue", this.currentValue)
                .done();
        }

        return this.currentValue;
    }

    invalidate(updateNow = false): Promise<T> | null {
        this.refreshNextUpdate = true;
        if(updateNow) {
            return this.getValue();
        }
        console.log("INFO", "Core.Cache", `Invalidated cache [${this.key}]`);
        return null;
    }
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
    cache: Map<string, CacheEntry<any>> = new Map();

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
