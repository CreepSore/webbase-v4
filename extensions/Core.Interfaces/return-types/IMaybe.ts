export default interface IMaybe<T> {
    get value(): T;
    get hasValue(): boolean;
}
