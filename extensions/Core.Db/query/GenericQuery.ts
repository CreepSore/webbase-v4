import IDbQuery from "./IDbQuery";

export default class GenericQuery<T> implements IDbQuery<T> {
    private _isSingle: boolean;
    private _requiredFields: ((keyof (T extends Array<infer U> ? U : T))[]) | null = null;
    private _filters: Record<string, any> = {};

    get isSingle(): boolean {
        return this._isSingle;
    }

    get requiredFields(): ((keyof (T extends Array<infer U> ? U : T))[]) | null {
        return this._requiredFields;
    }

    constructor(
        single: boolean = false,
        requiredFields: ((keyof (T extends Array<infer U> ? U : T))[]) | null = null,
        filters: Record<string, any> = {}
    ) {
        this._isSingle = single;
        this._requiredFields = requiredFields;
        this._filters = filters;
    }
}
