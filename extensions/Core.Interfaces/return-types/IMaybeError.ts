import IMaybe from "./IMaybe";

export default interface IMaybeError<TValue, TError = Error> extends IMaybe<TValue> {
    get error(): TError;
    get hasError(): boolean;
    throwOnError(): asserts this is this & { hasError: false };
}
