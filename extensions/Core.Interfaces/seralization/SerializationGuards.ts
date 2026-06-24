import IProducesSerializable from "./IProducesSerializable";
import IProducesSerializableAsync from "./IProducesSerializableAsync";

export default class SerializationGuard {
    static isIProducesSerializable<T = any>(obj: any): obj is IProducesSerializable<T> {
        return typeof obj?.produceSerializable === "function";
    }

    static isIProducesSerializableAsync<T = any>(obj: any): obj is IProducesSerializableAsync<T> {
        return typeof obj?.produceSerializableAsync === "function";
    }
}
