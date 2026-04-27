import IMaybeError from "../return-types/IMaybeError";

export default interface ICanApplySerializableAsync<T> {
    applySerializableAsync(serialized: T): Promise<IMaybeError<void>>;
}
