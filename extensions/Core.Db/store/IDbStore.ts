import IDbQuery from "../query/IDbQuery";

export default interface IDbStore<T> {
    executeQuery(query: IDbQuery<T>): Promise<T>;
}
