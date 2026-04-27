import IMaybe from "../return-types/IMaybe";
import IMaybeError from "../return-types/IMaybeError";

export default interface ICanApplySerializedAsync<T> {
    applySerialized(serialized: T): Promise<IMaybeError<void>>;
}
