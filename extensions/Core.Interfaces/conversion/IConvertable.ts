export default interface IConvertable<TValue, TKey = new(...args: any[]) => TValue> {
    convertTo(key: TKey): TValue;
}
