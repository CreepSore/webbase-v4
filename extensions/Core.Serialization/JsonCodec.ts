import IMaybeError from "../Core.Interfaces/return-types/IMaybeError";
import MaybeError from "../Core.Interfaces/return-types/MaybeError";
import IDeserializer from "../Core.Interfaces/seralization/IDeserializer";
import IProducesSerializable from "../Core.Interfaces/seralization/IProducesSerializable";
import ISerializer from "../Core.Interfaces/seralization/ISerializer";
import CodecError from "./CodecError";

export default class JsonCodec<T> implements ISerializer<T, string, CodecError>, IDeserializer<string, T, CodecError> {
    private _replacer?: ((this: any, key: string, value: any) => any) | undefined;
    private _space?: string | number | undefined;

    constructor(
        replacer?: ((this: any, key: string, value: any) => any) | undefined,
        space?: string | number | undefined
    ) {
        this._replacer = replacer;
        this._space = space;
    }

    deserialize(input: string): IMaybeError<T, CodecError> {
        try {
            return MaybeError.fromValue(JSON.parse(input) as T);
        }
        catch(err) {
            return MaybeError.fromError(new CodecError("Failed to deserialize JSON", err as Error, true));
        }
    }

    serialize(input: T): IMaybeError<string, CodecError> {
        try {
            return MaybeError.fromValue(JSON.stringify(input, this._replacer, this._space));
        }
        catch(err) {
            return MaybeError.fromError(new CodecError("Failed to serialize JSON", err as Error, false));
        }
    }
}
