import LogBuilder from "../../src/service/logger/LogBuilder";

export default interface ICacheEntry<T> {
    get key(): string;
    get lifetime(): number;
    get isValid(): boolean;

    setLifetimeMs(lifetime: number): this;
    getValue(): Promise<T>;

    invalidate(): this;
    invalidateAndUpdate(): Promise<T>;

    setLogger(logBuilder: LogBuilder): this;
}
