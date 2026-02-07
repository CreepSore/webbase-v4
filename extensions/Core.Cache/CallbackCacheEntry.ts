import LogBuilder from "../../src/service/logger/LogBuilder";
import ICacheEntry from "./ICacheEntry";

export type CallbackCacheEntryUpdateCallback<T> = (oldValue: T) => Promise<T> | T;

export default class CallbackCacheEntry<T> implements ICacheEntry<T> {
    private _key: string;
    private _lifetime: number;
    private _isValid: boolean;

    private _lastUpdate: number;
    private _log: LogBuilder;

    private _updateCallback: CallbackCacheEntryUpdateCallback<T>;
    private _currentValue: T;

    get key(): string {
        return this._key;
    }

    get lifetime(): number {
        return this._lifetime;
    }

    get isValid(): boolean {
        return this._isValid;
    }

    constructor(key: string, defaultValue: T = undefined) {
        this._key = key;
        this._currentValue = defaultValue;
    }

    setUpdateCallback(callback: CallbackCacheEntryUpdateCallback<T>): this {
        this._updateCallback = callback;
        return this;
    }

    setLifetimeMs(lifetime: number): this {
        this._lifetime = lifetime;
        return this;
    }

    async getValue(): Promise<T> {
        if(!this._isValid || Date.now() - this._lastUpdate > this._lifetime) {
            this._currentValue = await this._updateCallback(this._currentValue);

            if(this._log) {
                this._log
                    .start()
                    .level(LogBuilder.LogLevel.INFO)
                    .info(this._key)
                    .line("Updated value.")
                    .done();
            }
        }

        return this._currentValue;
    }

    invalidate(): this {
        this._isValid = false;
        return this;
    }

    invalidateAndUpdate(): Promise<T> {
        throw new Error("Method not implemented.");
    }

    setLogger(logBuilder: LogBuilder): this {
        this._log = logBuilder;
        return this;
    }
}
