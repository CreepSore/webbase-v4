export interface IJsonConvertable {
    toJson(): string;
    applyJson(json: string): this
}
