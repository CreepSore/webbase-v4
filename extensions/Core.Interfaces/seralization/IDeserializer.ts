import IMaybeError from "../return-types/IMaybeError";

export default interface IDeserializer<TIn, TOut, TErr = never> {
    deserialize(input: TIn): IMaybeError<TOut, TErr>;
}
