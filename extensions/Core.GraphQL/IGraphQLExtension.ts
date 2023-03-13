import { GraphQLSchema } from "graphql";
import { Request } from "express";

export default interface IGraphQLExtension {
    buildGraphQLSchema: () => GraphQLSchema;
    buildGraphQLContext: (req: Request<Request<any, any, any, any, Record<string, any>>, undefined>) => Promise<{[key: string]: any}>;
};
