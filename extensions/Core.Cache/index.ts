import {EventEmitter} from "events";

import IExecutionContext from "@service/extensions/IExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import ConfigLoader from "@logic/config/ConfigLoader";
import LogBuilder from "@service/logger/LogBuilder";

class CacheConfig {

}

interface CacheEntryConfig<T> {
    key: string;
    updateCallback: () => Promise<T> | T;
    defaultValue?: T;
    updateEveryMs?: number;
}

class CacheEntry<T> {
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

    async getValue() {
        if(this.refreshNextUpdate || (this.updateEveryMs > 0 && (Date.now() - Number(this.lastUpdate) > this.updateEveryMs))) {
            this.refreshNextUpdate = false;
            LogBuilder
                .start()
                .level("INFO")
                .info("Core.Cache")
                .line(`Executing update-function for cache [${this.key}]`)
                .done();
            this.currentValue = await this.updateCallback();
            LogBuilder
                .start()
                .level("INFO")
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
    metadata: ExtensionMetadata = {
        name: "Core.Cache",
        version: "1.0.0",
        description: "Caching Module",
        author: "ehdes",
        dependencies: ["Core"],
    };

    config: CacheConfig;
    configLoader: ConfigLoader<typeof this.config>;
    events: EventEmitter = new EventEmitter();
    cache: Map<string, CacheEntry<any>> = new Map();

    constructor() {
        this.config = this.loadConfig();
    }

    async start(executionContext: IExecutionContext) {
        this.checkConfig();
        if(executionContext.contextType === "cli") {
            return;
        }
    }

    async stop() {

    }

    createCacheEntry<T>(config: CacheEntryConfig<T>) {
        const entry = new CacheEntry<T>(config);
        this.cache.set(entry.key, entry);
        return entry;
    }

    cacheEntryExists(key: string) {
        return this.cache.has(key);
    }

    getCacheEntry<T>(key: string) {
        return this.cache.get(key) as CacheEntry<T>;
    }

    getCachedValue<T>(key: string, defaultValue: T) {
        return (this.getCacheEntry(key)?.currentValue || defaultValue) as T;
    }

    invalidateCache(key: string, updateNow = false) {
        const entry = this.cache.get(key);
        if(entry) {
            entry.invalidate(updateNow);
        }
    }

    clearCache() {
        this.cache.clear();
    }

    private checkConfig() {
        if(!this.config) {
            throw new Error(`Config could not be found at [${this.configLoader.configPath}]`);
        }
    }

    private loadConfig() {
        const model = new CacheConfig();
        if(Object.keys(model).length === 0) return model;

        const [cfgname, templatename] = this.generateConfigNames();
        this.configLoader = new ConfigLoader(cfgname, templatename);
        const cfg = this.configLoader.createTemplateAndImport(model);

        return cfg;
    }

    private generateConfigNames() {
        return [
            ConfigLoader.createConfigPath(`${this.metadata.name}.json`),
            ConfigLoader.createConfigPath(`${this.metadata.name}.template.json`),
        ];
    }
}
