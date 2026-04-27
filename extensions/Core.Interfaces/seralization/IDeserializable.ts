export default interface IDeserializable<T> {
    deserialize(input: T): void;
}
