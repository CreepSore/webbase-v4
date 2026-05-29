import ICanApplySerializable from "../seralization/ICanApplySerializable";
import IProducesSerializable from "../seralization/IProducesSerializable";
import IMaybeError from "./IMaybeError";
import { MaybeSerializable } from "./Maybe";

export type MaybeErrorSerializable<TValue> = MaybeSerializable<TValue> & {
    error: string | null;
    hasError: boolean;
}

export default class MaybeError<TValue, TError = Error>
implements
IMaybeError<TValue, TError>,
IProducesSerializable<MaybeErrorSerializable<TValue>>,
ICanApplySerializable<MaybeErrorSerializable<TValue>> {
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

    applySerializable(serialized: MaybeErrorSerializable<TValue>): IMaybeError<void> {
        this._value = serialized.value as TValue;
        this._hasValue= serialized.hasValue;
        this._hasError = serialized.hasError;
        if(serialized.error) {
            this._error = new Error(serialized.error || undefined) as TError;
        }
        return MaybeError.void();
    }

    produceSerializable(): MaybeErrorSerializable<TValue> {
        return {
            value: this._value,
            hasValue: this._hasValue,
            error: String(this._error) || null,
            hasError: this._hasError,
        };
    }

    throwOnError(): asserts this is this & { hasError: false } {
        if(this._hasError) {
            throw this._error || new Error("hasError is set but no error set!");
        }
    }

    static fromError<TError>(error: TError): MaybeError<any, TError> {
        return new MaybeError<any, TError>(undefined, error, false, true);
    }

    static fromNullable<TValue>(value: TValue | null | undefined): MaybeError<TValue, any> {
        return new MaybeError<TValue, any>(value);
    }

    static fromValue<TValue>(value: TValue): MaybeError<TValue, any> {
        return new MaybeError<TValue, any>(value, undefined, true, false);
    }

    static fromPromise<TValue, TError = any>(promise: Promise<TValue>): Promise<MaybeError<TValue, TError>> {
        return promise
            .then(value => MaybeError.fromValue(value))
            .catch(error => MaybeError.fromError(error));
    }

    static wrap<TValue, TError>(fn: () => any): MaybeError<TValue, TError> {
        try {
            const result = fn();
            return MaybeError.fromValue(result);
        }
        catch(error) {
            return MaybeError.fromError(error as TError);
        }
    }

    static void(): MaybeError<void, any> {
        return MaybeError.fromValue(undefined);
    }
}
