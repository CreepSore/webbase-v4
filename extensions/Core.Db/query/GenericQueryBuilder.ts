import GenericQuery from "./GenericQuery";

export default class GenericQueryBuilder<T> {
    private _isSingle: boolean = false;
    private _requiredFields: ((keyof (T extends Array<infer U> ? U : T))[]) | null = null;
    private _filters: Record<string, any> = {};

    single(): GenericQueryBuilder<T extends Array<infer U> ? U : T> {
        this._isSingle = true;
        return this as GenericQueryBuilder<T extends Array<infer U> ? U : T>;
    }

    multi(): GenericQueryBuilder<T[]> {
        this._isSingle = false;
        return this as any as GenericQueryBuilder<T[]>;
    }

    requiredFields(fields: (keyof (T extends Array<infer U> ? U : T))[]): GenericQueryBuilder<T> {
        if(!this._requiredFields) {
            this._requiredFields = fields;
        }

        return this;
    }

    filter(field: keyof (T extends Array<infer U> ? U : T), value: any): GenericQueryBuilder<T> {
        this._filters[field as string] = value;
        return this;
    }

    build(): GenericQuery<T> {
        const query = new GenericQuery<T>(
            this._isSingle,
            this._requiredFields,
            this._filters,
        );

        return query;
    }
}
