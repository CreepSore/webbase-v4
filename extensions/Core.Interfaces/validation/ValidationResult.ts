import IValidationResult from "./IValidationResult";

export default class ValidationResult implements IValidationResult {
    private _invalidProperties: Map<string, string> = new Map();

    get isValid(): boolean {
        return this._invalidProperties.size === 0;
    }

    get invalidProperties(): ReadonlyMap<string, string> {
        return this._invalidProperties;
    }

    addInvalidProperty(name: string, error: string): this {
        this._invalidProperties.set(name, error);
        return this;
    }
}
