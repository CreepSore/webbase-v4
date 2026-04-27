import IMaybeError from "../return-types/IMaybeError";

export default interface ICanApplySerialized<T> {
    applySerialized(serialized: T): IMaybeError<void>;
}
