export default interface IProducesSerializableAsync<T> {
    produceSerializableAsync(): Promise<T>;
}
