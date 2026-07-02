import IDbQuery from "./IDbQuery";

export default interface IQueryTranslator<TResult> {
    translate<T>(query: IDbQuery<T>): TResult;
}
