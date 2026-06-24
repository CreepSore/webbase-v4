type PropertyName = string;
type PropertyError = string;

export default interface IValidationResult {
    get isValid(): boolean;
    get invalidProperties(): ReadonlyMap<string, string>;
}
