import IMaybe from "./IMaybe";

export default class Maybe<T> implements IMaybe<T> {
    private _value: T | null | undefined;
    private _hasValue: boolean;

    constructor(value: T | null | undefined = undefined, hasValue: boolean | undefined = undefined) {
        this._value = value;

        if(this.hasValue !== undefined && this.hasValue !== null) {
            this._hasValue = Boolean(hasValue);
            return;
        }

        this._hasValue = value !== null && value !== undefined;
    }

    get value(): T {
        return this._value as T;
    }

    get hasValue(): boolean {
        return this._hasValue;
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

    static void(): Maybe<void> {
        return Maybe.fromValue(undefined);
    }
}
