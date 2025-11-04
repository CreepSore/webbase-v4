import CacheEntryConfig from "./CacheEntryConfig";

export default class CacheEntry<T> {
    key: string;
    currentValue: T;
    defaultValue?: T;
    refreshNextUpdate?: boolean;
    lastUpdate: Date;
    updateEveryMs?: number;
    log: (level: string, message: string) => any;
    private updateCallback: () => Promise<T> | T;

    constructor(config: CacheEntryConfig<T>) {
        this.key = config.key;
        this.updateCallback = config.updateCallback;
        this.currentValue = this.defaultValue = config.defaultValue;
        this.lastUpdate = this.defaultValue ? new Date() : new Date(0);
        this.updateEveryMs = config.updateEveryMs;
        this.refreshNextUpdate = !this.defaultValue;
        this.log = config.log;
    }

    async getValue(): Promise<T> {
        const timeoutReached = (Date.now() - Number(this.lastUpdate) > this.updateEveryMs);

        if(this.refreshNextUpdate || (this.updateEveryMs > 0 && timeoutReached)) {
            this.refreshNextUpdate = false;
            this.lastUpdate = new Date();

            if(this.log) {
                this.log("INFO", `Executing update-function for cache [${this.key}]`);
            }

            this.currentValue = await this.updateCallback();
        }

        return this.currentValue;
    }

    invalidate(updateNow = false): Promise<T> | null {
        this.refreshNextUpdate = true;

        let result: Promise<T> = null;

        if(updateNow) {
            result = this.getValue();
        }

        if(this.log) {
            this.log("INFO", `Invalidated cache [${this.key}]`);
        }

        return null;
    }
}