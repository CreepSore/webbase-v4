import {EventEmitter} from "events";

import * as GraphQL from "graphql";
import * as GraphQLToolsSchema from "@graphql-tools/schema";
import * as GraphQLExpress from "graphql-http/lib/use/express";

import IExecutionContext from "@service/extensions/IExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import ConfigLoader from "@logic/config/ConfigLoader";
import CoreWeb from "@extensions/Core.Web";
import IGraphQLExtension from "./IGraphQLExtension";
import LogBuilder from "@service/logger/LogBuilder";
import Core from "@extensions/Core";

class CoreGraphQLConfig {

}

export default class CoreGraphQL implements IExtension {
    static metadata: ExtensionMetadata = {
        name: "Core.GraphQL",
        version: "1.0.0",
        description: "Template Module",
        author: "ehdes",
        dependencies: [Core.metadata.name, CoreWeb.metadata.name],
    };

    metadata: ExtensionMetadata = CoreGraphQL.metadata;

    config: CoreGraphQLConfig;
    events: EventEmitter = new EventEmitter();
    schemes: GraphQL.GraphQLSchema[];
    rootSchema: GraphQL.GraphQLSchema;
    graphQlExtensions: Set<IGraphQLExtension> = new Set();

    constructor() {
        this.config = this.loadConfig(true);
    }

    async start(executionContext: IExecutionContext): Promise<void> {
        this.checkConfig();
        if(executionContext.contextType === "cli") {
            return;
        }

        executionContext.extensionService.onAllExtensionsStarted(ctx => this.onAllExtensionsStarted(ctx));
    }

    async stop(): Promise<void> {

    }

    addQueryHandler<T>(key: string, handler: (...props: any) => T): void {

    }

    registerExtension(extension: IGraphQLExtension): void {
        this.graphQlExtensions.add(extension);
    }

    unregisterExtension(extension: IGraphQLExtension): void {
        this.graphQlExtensions.delete(extension);
    }

    private onAllExtensionsStarted(context: IExecutionContext): void {
        if(context.contextType === "cli") {
            return;
        }

        const coreWeb = context.extensionService.getExtension("Core.Web") as CoreWeb;
        this.schemes = [];
        let hasError = false;

        this.graphQlExtensions.forEach(extension => {
            try {
                const schema = extension.buildGraphQLSchema();
                if(schema === null) return;
                this.schemes.push(schema);
            }
            catch(err) {
                hasError = true;

                // @ts-ignore
                if(extension.metadata?.name) console.log("ERROR", "Core.GraphQL", `Failed to build schema for extension ${extension.metadata.name}: ${err}`);
            }
        });

        if(!hasError) {
            console.log("INFO", "Core.GraphQL", "Successfully loaded all GraphQL Schemes");
        }
        else {
            console.log("WARN", "Core.GraphQL", "Failed to load some GraphQL Schemes");
        }

        if(this.schemes.length !== 0) {
            this.rootSchema = GraphQLToolsSchema.mergeSchemas({schemas: this.schemes});
            const opt: GraphQLExpress.HandlerOptions<undefined> = {
                schema: this.rootSchema,
                context: async(req): Promise<any> => {
                    const ctx: {[key: string]: any} = {};
                    ctx.req = req.raw;
                    for(const extension of this.graphQlExtensions) {
                        // @ts-ignore
                        const extCtx = await extension.buildGraphQLContext(req);
                        Object.entries(extCtx).forEach(([key, value]) => {
                            ctx[key] = value;
                        });
                    }
                    return ctx;
                },
            };
            const handler = GraphQLExpress.createHandler(opt);
            coreWeb.skipLogForUrl("/api/core.graphql");
            coreWeb.app.use("/api/core.graphql", (req, res, next) => {
                LogBuilder
                    .start()
                    .level("NOTE")
                    .info("Core.GraphQL")
                    .line(`${req.headers["x-forwarded-for"] || req.socket.remoteAddress} ran Query`)
                    .object("query", req.body.query)
                    .debugObject("variables", req.body.variables)
                    .done();

                next();
            }, handler);
        }
        else {
            coreWeb.app.use("/api/core.graphql", (req, res) => {
                res.json({data: null, errors: [{message: "No GraphQL Schemes Found"}]});
            });
        }
    }

    fieldsFromResolveInfo(info: GraphQL.GraphQLResolveInfo): any {
        return this.nodeToObject(info.fieldNodes[0]);
    }

    private nodeToObject(node: GraphQL.SelectionNode): any {
        if(node.kind !== GraphQL.Kind.FIELD) return {};
        if(!node.selectionSet) return {};
        const result: any = {};

        node.selectionSet.selections.forEach(selection => {
            if(selection.kind !== GraphQL.Kind.FIELD) {
                return {};
            }

            let nodeRes = {};
            if(selection.kind === GraphQL.Kind.FIELD
                && selection.selectionSet) {
                nodeRes = this.nodeToObject(selection);
            }

            result[selection.name.value] = nodeRes;
            return null;
        });

        return result;
    }

    private checkConfig(): void {
        if(!this.config) {
            throw new Error(`Config could not be found at [${this.generateConfigNames()[0]}]`);
        }
    }

    private loadConfig(createDefault: boolean = false): typeof this.config {
        const [configPath, templatePath] = this.generateConfigNames();
        return ConfigLoader.initConfigWithModel(
            configPath,
            templatePath,
            new CoreGraphQLConfig(),
            createDefault,
        );
    }

    private generateConfigNames(): string[] {
        return [
            ConfigLoader.createConfigPath(`${this.metadata.name}.json`),
            ConfigLoader.createTemplateConfigPath(`${this.metadata.name}.json`),
        ];
    }
}
