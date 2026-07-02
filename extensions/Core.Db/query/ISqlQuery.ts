import IDbQuery from "./IDbQuery";
import IDbQueryResult from "./IDbQueryResult";
import ISqlQueryResult from "./ISqlQueryResult";

export default interface ISqlQuery<T, TResult extends ISqlQueryResult<T> = ISqlQueryResult<T>> extends IDbQuery<T, TResult> {
    sql: string;
    binds: Record<string, any>;
}
