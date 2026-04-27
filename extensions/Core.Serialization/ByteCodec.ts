import IMaybeError from "../Core.Interfaces/return-types/IMaybeError";
import MaybeError from "../Core.Interfaces/return-types/MaybeError";
import IDeserializer from "../Core.Interfaces/seralization/IDeserializer";
import ISerializer from "../Core.Interfaces/seralization/ISerializer";
import CodecError from "./CodecError";

export default class ByteCodec<T> implements ISerializer<T, Uint8Array, CodecError>, IDeserializer<Uint8Array, T, CodecError> {
    private _order: (keyof T)[] = [];
    private _types: ("string"|"int8"|"int16"|"int32"|"int64"|"float"|"double"|"boolean")[] = [];

    private _typeCodecs: Map<string, {
        getLength: (value: any) => number,
        serialize: (value: any, view: DataView, offset: number) => number,
        deserialize: (view: DataView, offset: number) => {value: any, bytesRead: number}}
    > = new Map();

    private _textEncoder: TextEncoder = new TextEncoder();
    private _textDecoder: TextDecoder = new TextDecoder();

    constructor(order: typeof this._order, types: typeof this._types) {
        this._order = order;
        this._types = types;

        this._typeCodecs.set("string", {
            getLength: (value: string) => 4 + value.length,
            serialize: (value: string, view: DataView, offset: number) => {
                const stringBytes = this._textEncoder.encode(value);
                view.setUint32(offset, stringBytes.length, true);
                new Uint8Array(view.buffer, offset + 4, stringBytes.length).set(stringBytes);
                return 4 + stringBytes.length;
            },
            deserialize: (view: DataView, offset: number) => {
                const length = view.getUint32(offset, true);
                const bytes = new Uint8Array(view.buffer, offset + 4, length);
                return {
                    value: this._textDecoder.decode(bytes),
                    bytesRead: 4 + length
                };
            }
        });

        this._typeCodecs.set("int8", {
            getLength: (_value: number) => 1,
            serialize: (value: number, view: DataView, offset: number) => {
                view.setInt8(offset, value);
                return 1;
            },
            deserialize: (view: DataView, offset: number) => {
                return {
                    value: view.getInt8(offset),
                    bytesRead: 1
                };
            }
        });

        this._typeCodecs.set("int16", {
            getLength: (_value: number) => 2,
            serialize: (value: number, view: DataView, offset: number) => {
                view.setInt16(offset, value, true);
                return 2;
            },
            deserialize: (view: DataView, offset: number) => {
                return {
                    value: view.getInt16(offset, true),
                    bytesRead: 2
                };
            }
        });

        this._typeCodecs.set("int32", {
            getLength: (_value: number) => 4,
            serialize: (value: number, view: DataView, offset: number) => {
                view.setInt32(offset, value, true);
                return 4;
            },
            deserialize: (view: DataView, offset: number) => {
                return {
                    value: view.getInt32(offset, true),
                    bytesRead: 4
                };
            }
        });

        this._typeCodecs.set("int64", {
            getLength: (_value: bigint) => 8,
            serialize: (value: bigint, view: DataView, offset: number) => {
                view.setBigInt64(offset, value, true);
                return 8;
            },
            deserialize: (view: DataView, offset: number) => {
                return {
                    value: view.getBigInt64(offset, true),
                    bytesRead: 8
                };
            }
        });

        this._typeCodecs.set("float", {
            getLength: (_value: number) => 4,
            serialize: (value: number, view: DataView, offset: number) => {
                view.setFloat32(offset, value, true);
                return 4;
            },
            deserialize: (view: DataView, offset: number) => {
                return {
                    value: view.getFloat32(offset, true),
                    bytesRead: 4
                };
            }
        });

        this._typeCodecs.set("double", {
            getLength: (_value: number) => 8,
            serialize: (value: number, view: DataView, offset: number) => {
                view.setFloat64(offset, value, true);
                return 8;
            },
            deserialize: (view: DataView, offset: number) => {
                return {
                    value: view.getFloat64(offset, true),
                    bytesRead: 8
                };
            }
        });

        this._typeCodecs.set("boolean", {
            getLength: (_value: boolean) => 1,
            serialize: (value: boolean, view: DataView, offset: number) => {
                view.setUint8(offset, value ? 1 : 0);
                return 1;
            },
            deserialize: (view: DataView, offset: number) => {
                return {
                    value: view.getUint8(offset) === 1,
                    bytesRead: 1
                };
            }
        });
    }

    serialize(input: T): IMaybeError<Uint8Array<ArrayBufferLike>, CodecError> {
        try {
            let bufferLength = 1024;
            let buffer = new ArrayBuffer(bufferLength);
            const view = new DataView(buffer);
            let currentIndex: number = 0;

            const checkAndExpandBuffer = (additionalSize: number) => {
                if(currentIndex + additionalSize <= buffer.byteLength) {
                    return;
                }

                bufferLength *= 2;
                const newBuffer = new ArrayBuffer(bufferLength);
                new Uint8Array(newBuffer).set(new Uint8Array(buffer));
                buffer = newBuffer;
            }

            for(const [index, key] of this._order.entries()) {
                const value = input[key];
                const type = this._types[index];

                const typeConverter = this._typeCodecs.get(type);
                if(!typeConverter) {
                    throw new CodecError(`Unsupported type for key "${String(key)}" at index ${index}: ${type}`);
                }

                const { getLength, serialize } = typeConverter;
                const valueLength = getLength(value);
                checkAndExpandBuffer(valueLength);

                const writtenBytes = serialize(value, view, currentIndex);
                currentIndex += writtenBytes;
            }

            return MaybeError.fromValue(new Uint8Array(buffer, 0, currentIndex));
        }
        catch(err) {
            return MaybeError.fromError(
                err instanceof CodecError
                    ? err
                    : new CodecError(
                        "Failed to serialize input",
                        err instanceof Error
                            ? err
                            : undefined
                        , false
                    )
            );
        }
    }

    deserialize(input: Uint8Array<ArrayBufferLike>): IMaybeError<T, CodecError> {
        try {
            const view = new DataView(input.buffer);
            const result = {} as T;
            let currentIndex: number = 0;

            for(const [index, key] of this._order.entries()) {
                const typeConverter = this._typeCodecs.get(this._types[index]);
                if(!typeConverter) {
                    throw new CodecError(`Unsupported type for key "${String(key)}" at index ${index}`);
                }

                const { deserialize } = typeConverter;
                const { value, bytesRead } = deserialize(view, currentIndex);
                result[key] = value;
                currentIndex += bytesRead;
            }

            return MaybeError.fromValue(result);
        }
        catch(err) {
            return MaybeError.fromError(
                err instanceof CodecError
                    ? err
                    : new CodecError(
                        "Failed to serialize input",
                        err instanceof Error
                            ? err
                            : undefined
                        , true
                    )
            );
        }
    }
}
