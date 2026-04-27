import IDeserializer from "../Core.Interfaces/seralization/IDeserializer";
import ISerializer from "../Core.Interfaces/seralization/ISerializer";
import CodecError from "./CodecError";

type Constructor<T> = new (...args: any[]) => T;

export default class CodecFactory {
    private _serializers: Map<string, Map<Constructor<any>, ISerializer<any, any, CodecError>>> = new Map();
    private _deserializers: Map<string, Map<Constructor<any>, IDeserializer<any, any, CodecError>>> = new Map();

    defineSerializer<T, S>(
        format: string,
        type: Constructor<T>,
        serializer: ISerializer<T, S, CodecError>,
    ): this {
        if (!this._serializers.has(format)) {
            this._serializers.set(format, new Map());
        }

        const formatSerializers = this._serializers.get(format)!;
        formatSerializers.set(type, serializer);

        return this;
    }

    getSerializer<T, S>(format: string, type: Constructor<T>): ISerializer<T, S, CodecError> | null {
        const formatSerializers = this._serializers.get(format);
        if (!formatSerializers) {
            return null;
        }

        const serializer = formatSerializers.get(type);
        return serializer || null;
    }

    defineDeserializer<T, S>(
        format: string,
        type: Constructor<T>,
        serializer: IDeserializer<T, S, CodecError>,
    ): this {
        if (!this._deserializers.has(format)) {
            this._deserializers.set(format, new Map());
        }

        const formatDeserializers = this._deserializers.get(format)!;
        formatDeserializers.set(type, serializer);

        return this;
    }

    getDeserializer<T, S>(format: string, type: Constructor<T>): IDeserializer<T, S, CodecError> | null {
        const formatDeserializers = this._deserializers.get(format);
        if (!formatDeserializers) {
            return null;
        }

        const deserializer = formatDeserializers.get(type);
        return deserializer || null;
    }
}