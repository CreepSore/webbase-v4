export default interface ISerializableAsync<T> {
    serialize(): Promise<T>;
}
