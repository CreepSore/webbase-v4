import IProducesSerializable from "./IProducesSerializable";

export default interface IWithSubserializables {
    get serializables(): IProducesSerializable<any>[];
}
