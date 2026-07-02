import ISqlQuery from "../query/ISqlQuery";
import ISqlQueryResult from "../query/ISqlQueryResult";
import IDbDriver from "./IDbDriver";

export default interface ISqlDriver<TQuery extends ISqlQuery<any>, TQueryResult extends ISqlQueryResult<any>> extends IDbDriver<TQuery, TQueryResult> {

}