import IDbQueryResult from "./IDbQueryResult";

export default interface ISqlQueryResult<T> extends IDbQueryResult<T> {
    rowsAffected: number;
}
