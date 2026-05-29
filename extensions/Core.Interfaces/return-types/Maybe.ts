import ICanApplySerializable from "../seralization/ICanApplySerializable";
import IProducesSerializable from "../seralization/IProducesSerializable";
import IMaybe from "./IMaybe";
import IMaybeError from "./IMaybeError";
import MaybeError from "./MaybeError";

export type MaybeSerializable<T> = {
    value: T;
    hasValue: boolean;
}

export default class Maybe<T> implements IMaybe<T>, IProducesSerializable<MaybeSerializable<T>>, ICanApplySerializable<MaybeSerializable<T>> {
    private _value: T | null | undefined;
    private _hasValue: boolean;

    get value(): T {
        return this._value as T;
    }

    get hasValue(): boolean {
        return this._hasValue;
    }

    constructor(value: T | null | undefined = undefined, hasValue: boolean | undefined = undefined) {
        this._value = value;

        if(this.hasValue !== undefined && this.hasValue !== null) {
            this._hasValue = Boolean(hasValue);
            return;
        }

        this._hasValue = value !== null && value !== undefined;
    }


    applySerializable(serialized: MaybeSerializable<T>): IMaybeError<void> {
        this._value = serialized.value;
        this._hasValue = serialized.hasValue;
        return MaybeError.void();
    }

    produceSerializable(): MaybeSerializable<T> {
        return {
            value: this._value as T,
            hasValue: this._hasValue
        };
    }

    static never(): Maybe<never> {
        return new Maybe<never>(undefined, false);
    }

    static fromNullable<T>(value: T | null | undefined): Maybe<T> {
        return new Maybe(value);
    }

    static fromValue<T>(value: T): Maybe<T> {
        return new Maybe(value, true);
    }

    static fromPromise<T>(promise: Promise<T>): Promise<Maybe<T>> {
        return promise
            .then(value => Maybe.fromValue(value))
            .catch(() => Maybe.never());
    }

    static fromSerializable<T>(serialized: MaybeSerializable<T>): Maybe<T> {
        const maybe = new Maybe<T>();
        maybe.applySerializable(serialized);
        return maybe;
    }

    static wrap<TValue, TError>(fn: () => any): Maybe<TValue> {
        try {
            const result = fn();
            return Maybe.fromValue(result);
        }
        catch(error) {
            return new Maybe<TValue>(undefined, false);
        }
    }

    static void(): Maybe<void> {
        return Maybe.fromValue(undefined);
    }
}
