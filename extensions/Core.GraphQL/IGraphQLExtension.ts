import { GraphQLSchema } from "graphql";

export default interface IGraphQLExtension {
    buildGraphQLSchema: () => GraphQLSchema;
}