import ISqlQuery from "../../Core.Db/query/ISqlQuery";
import ISqlQueryResult from "../../Core.Db/query/ISqlQueryResult";
import { QueryType } from "../../Core.Db/query/QueryType";

export class PostgresSqlQueryResult<T> implements ISqlQueryResult<T> {
    data: T;
    rowsAffected: number;

    constructor(data: T, rowsAffected: number = 0) {
        this.data = data;
        this.rowsAffected = rowsAffected;
    }
}

export default class PostgresSqlQuery<T> implements ISqlQuery<T> {
    sql: string;
    binds: Record<string, any>;

    constructor(sql: string, binds: Record<string, any> = {}) {
        this.sql = sql;
        this.binds = binds;
    }
}
