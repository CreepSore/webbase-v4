export default class SqlBindConverter {
    private _sql: string;
    private _binds: Record<string, any>;

    constructor(sql: string, binds: Record<string, any>) {
        this._sql = sql;
        this._binds = binds;
    }
}
