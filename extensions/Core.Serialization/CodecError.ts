export default class CodecError extends Error {
    private _cause?: Error;
    private _isDeserializing: boolean;

    get cause(): Error | undefined {
        return this._cause;
    }

    get isDeserializing(): boolean {
        return this._isDeserializing;
    }

    constructor(message: string, cause?: Error, isDeserializing: boolean = false) {
        super(message);
        this._cause = cause;
        this._isDeserializing = isDeserializing;
    }

    toString(): string {
        let result = `${this.name}: ${this.message}`;
        if (this._cause) {
            result += `\n  Caused by: ${this._cause.toString()}`;
        }
        return result;
    }
}
