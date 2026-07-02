import * as pg from "pg";
import PostgresSqlQuery, { PostgresSqlQueryResult } from "./PostgresSqlQuery";
import ISqlDriver from "../../Core.Db/driver/ISqlDriver";
import IStartable from "../../Core.Interfaces/lifetime/IStartable";
import IStoppable from "../../Core.Interfaces/lifetime/IStoppable";
import { QueryType } from "../../Core.Db/query/QueryType";

export type PostgresSqlDriverConfiguration = {
    host: string;
    port?: number;
    database: string;

    user: string;
    password: string;

    maxPoolClients?: number;
};

export default class PostgresSqlDriver implements ISqlDriver<PostgresSqlQuery<any>, PostgresSqlQueryResult<any>>, IStartable, IStoppable {
    private _config: PostgresSqlDriverConfiguration;
    private _pool: pg.Pool;
    private _isStarted: boolean = false;

    constructor(config: PostgresSqlDriverConfiguration) {
        this._config = config;
        this._pool = new pg.Pool({
            host: this._config.host,
            port: this._config.port || 5432,
            database: this._config.database,
            user: this._config.user,
            password: this._config.password,
            keepAlive: true,
            max: this._config.maxPoolClients || 1,
        });
    }

    start(): Promise<void> {
        if(this._isStarted) {
            return Promise.resolve();
        }

        return this._pool.connect()
            .then(() => {
                this._isStarted = true;
            });
    }

    stop(): Promise<void> {
        if(!this._isStarted) {
            return Promise.resolve();
        }

        return this._pool.end()
            .then(() => {
                this._isStarted = false;
            });
    }

    executeQuery<T, TResult extends PostgresSqlQueryResult<T>>(query: PostgresSqlQuery<T>): Promise<TResult> {
        const converted = this._convertQuery(query.sql, query.binds);

        return this._pool.query(converted.sql, converted.binds)
            .then((result: pg.QueryResult) => {
                const rowsAffected = result.rowCount || 0;
                const data = result.rows as T;

                return new PostgresSqlQueryResult<T>(data, rowsAffected) as TResult;
            });
    }

    private _convertQuery(sql: string, binds: Record<string, any>): { sql: string; binds: any[] } {
        const bindValues: any[] = [];
        const convertedSql = sql.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, bindName) => {
            if (!binds.hasOwnProperty(bindName)) {
                bindValues.push(null);
                return `$${bindValues.length}`;
            }

            bindValues.push(binds[bindName]);
            return `$${bindValues.length}`;
        });

        return { sql: convertedSql, binds: bindValues };
    }
}
