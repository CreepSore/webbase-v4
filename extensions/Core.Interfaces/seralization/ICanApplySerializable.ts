import IMaybeError from "../return-types/IMaybeError";

export default interface ICanApplySerializable<T> {
    applySerializable(serialized: T): IMaybeError<void>;
}
