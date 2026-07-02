import IDbQueryResult from "../query/IDbQueryResult";

export default interface IDbDriver<TQuery, TQueryResult extends IDbQueryResult<any>> {
    executeQuery<TResult extends TQueryResult>(query: TQuery): Promise<TResult>;
}
