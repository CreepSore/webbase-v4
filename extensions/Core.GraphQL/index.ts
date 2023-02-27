import {EventEmitter} from "events";
import * as fs from "fs";
import * as path from "path";

import * as GraphQL from "graphql";
import * as GraphQLToolsSchema from "@graphql-tools/schema";
import * as GraphQLExpress from 'graphql-http/lib/use/express';

import IExecutionContext from "@service/extensions/IExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import ConfigLoader from "@logic/config/ConfigLoader";
import CoreWeb from "@extensions/Core.Web";
import IGraphQLExtension from "./IGraphQLExtension";
import LogBuilder from "@service/logger/LogBuilder";

class CoreGraphQLConfig {

}

export default class CoreGraphQL implements IExtension {
    metadata: ExtensionMetadata = {
        name: "Core.GraphQL",
        version: "1.0.0",
        description: "Template Module",
        author: "ehdes",
        dependencies: ["Core", "Core.Web"]
    };

    config: CoreGraphQLConfig;
    configLoader: ConfigLoader<typeof this.config>;
    events: EventEmitter = new EventEmitter();
    schemes: GraphQL.GraphQLSchema[];
    rootSchema: GraphQL.GraphQLSchema;
    graphQlExtensions: Set<IGraphQLExtension> = new Set();

    constructor() {
        this.config = this.loadConfig();
    }

    async start(executionContext: IExecutionContext) {
        this.checkConfig();
        if(executionContext.contextType === "cli") {
            return;
        }

        executionContext.extensionService.onAllExtensionsStarted(ctx => this.onAllExtensionsStarted(ctx));
    }

    async stop() {

    }

    addQueryHandler<T>(key: string, handler: (...props: any) => T) {

    }

    registerExtension(extension: IGraphQLExtension) {
        this.graphQlExtensions.add(extension);
    }

    unregisterExtension(extension: IGraphQLExtension) {
        this.graphQlExtensions.delete(extension);
    }

    private onAllExtensionsStarted(context: IExecutionContext) {
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
                }
            };
            const handler = GraphQLExpress.createHandler(opt);
            coreWeb.skipLogForUrl("/api/core.graphql");
            coreWeb.app.use("/api/core.graphql", (req, res, next) => {
                LogBuilder
                    .start()
                    .level("NOTE")
                    .info("Core.GraphQL")
                    .line(`${req.headers['x-forwarded-for'] || req.socket.remoteAddress} ran Query`)
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

    fieldsFromResolveInfo(info: GraphQL.GraphQLResolveInfo) {
        return this.nodeToObject(info.fieldNodes[0]);
    }

    private nodeToObject(node: GraphQL.SelectionNode) {
        if(node.kind !== GraphQL.Kind.FIELD) return {};
        if(!node.selectionSet) return {}
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
        });

        return result;
    }

    private checkConfig() {
        if(!this.config) {
            throw new Error(`Config could not be found at [${this.configLoader.configPath}]`);
        }
    }

    private loadConfig() {
        let model = new CoreGraphQLConfig();
        if(Object.keys(model).length === 0) return model;

        let [cfgname, templatename] = this.generateConfigNames();
        this.configLoader = new ConfigLoader(cfgname, templatename);
        let cfg = this.configLoader.createTemplateAndImport(model);

        return cfg;
    }

    private generateConfigNames() {
        return [
            ConfigLoader.createConfigPath(`${this.metadata.name}.json`),
            ConfigLoader.createConfigPath(`${this.metadata.name}.template.json`)
        ];
    }
}
