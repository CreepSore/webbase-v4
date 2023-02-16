import {EventEmitter} from "events";
import * as fs from "fs";
import * as path from "path";

import * as GraphQL from "graphql";
import * as GraphQLToolsSchema from "@graphql-tools/schema";
import * as GraphQLExpress from 'graphql-http/lib/use/express';

import IExecutionContext from "@service/extensions/IExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import ConfigLoader from "@logic/config/ConfigLoader";
import CoreWeb from "../Core.Web";
import IGraphQLExtension from "./IGraphQLExtension";

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
                schema: this.rootSchema
            };
            const handler = GraphQLExpress.createHandler(opt);
            coreWeb.app.all("/api/core.graphql", handler);
        }
        else {
            coreWeb.app.all("/api/core.graphql", (req, res) => {
                res.write("GraphQL is disabled in this configuration.");
            });
        }
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
