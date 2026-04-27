import IMaybe from "../return-types/IMaybe";
import IMaybeError from "../return-types/IMaybeError";

export default interface ISerializer<TIn, TOut, TErr = never> {
    serialize(input: TIn): IMaybeError<TOut, TErr>;
}
