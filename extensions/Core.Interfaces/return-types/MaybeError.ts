import IMaybeError from "./IMaybeError";

export default class MaybeError<TValue, TError = Error> implements IMaybeError<TValue, TError> {
    private _value: TValue;
    private _error: TError;
    private _hasValue: boolean;
    private _hasError: boolean;

    get error(): TError {
        return this._error;
    }

    get hasError(): boolean {
        return this._hasError;
    }

    get value(): TValue {
        return this._value;
    }

    get hasValue(): boolean {
        return this._hasValue;
    }

    constructor(
        value: TValue | null | undefined = undefined,
        error: TError | null | undefined = undefined,
        hasValue: boolean | undefined = undefined,
        hasError: boolean | undefined = undefined,
    ) {
        this._value = value as TValue;
        this._error = error as TError;

        if(hasValue !== undefined && hasValue !== null) {
            this._hasValue = Boolean(hasValue);
        } else {
            this._hasValue = value !== null && value !== undefined;
        }

        if(hasError !== undefined && hasError !== null) {
            this._hasError = Boolean(hasError);
        } else {
            this._hasError = error !== null && error !== undefined;
        }
    }

    static fromError<TError>(error: TError): MaybeError<never, TError> {
        return new MaybeError<never, TError>(undefined, error, false, true);
    }

    static fromNullable<TValue>(value: TValue | null | undefined): MaybeError<TValue, never> {
        return new MaybeError<TValue, never>(value);
    }

    static fromValue<TValue>(value: TValue): MaybeError<TValue, never> {
        return new MaybeError<TValue, never>(value, undefined, true, false);
    }
}
