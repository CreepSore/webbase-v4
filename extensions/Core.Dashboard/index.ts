import {EventEmitter} from "events";
import * as fs from "fs";
import * as path from "path";

import IExecutionContext from "@service/extensions/IExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import ConfigLoader from "@logic/config/ConfigLoader";
import CoreWeb from "@extensions/Core.Web";
import CoreUsermgmtGraphQL from "@extensions/Core.Usermgmt.GraphQL";
import IGraphQLExtension from "@extensions/Core.GraphQL/IGraphQLExtension";

import { GraphQLSchema } from "graphql";
import * as GraphQLTools from "@graphql-tools/schema";
import LoggerService from "@service/logger/LoggerService";
import CacheLogger from "@service/logger/CacheLogger";

import Permissions from "./permissions";
import CoreGraphQL from "@extensions/Core.GraphQL";

export interface IDashboardPage {
    id: string;
    name: string;
    href: string;
    neededPermissions: string[];
}

class CoreDashboardConfig {

}

export default class CoreDashboard implements IExtension, IGraphQLExtension {
    metadata: ExtensionMetadata = {
        name: "Core.Dashboard",
        version: "2.0.0",
        description: "Dashboard Module",
        author: "ehdes",
        dependencies: ["Core", "Core.Usermgmt.GraphQL", "Core.GraphQL"],
    };

    config: CoreDashboardConfig;
    configLoader: ConfigLoader<typeof this.config>;
    events: EventEmitter = new EventEmitter();

    pages: IDashboardPage[];
    umgmtGql: CoreUsermgmtGraphQL;


    constructor() {
        this.config = this.loadConfig();
        this.pages = [];
    }

    async buildGraphQLContext(req: any): Promise<{[key: string]: any}> {
        return {};
    }

    buildGraphQLSchema(): GraphQLSchema {
        return GraphQLTools.makeExecutableSchema({
            typeDefs: fs.readFileSync(path.join(this.metadata.extensionPath, "schema.graphql"), "utf8"),
            resolvers: {
                Query: {
                    logs: (parent, args, context, info) => {
                        if(!this.umgmtGql.hasPermissions(context, Permissions.ViewLogs.name)) {
                            throw new Error("Invalid Permissions");
                        }

                        const cacheLogger = LoggerService.getLogger("cache") as CacheLogger;
                        return cacheLogger.logEntries.map(le => {
                            return {
                                ...le,
                                date: new Date(le.date).toISOString(),
                            };
                        });
                    },
                    pages: (parent, args, context, info) => {
                        return this.pages.filter(page => this.umgmtGql.hasPermissions(context, ...page.neededPermissions));
                    },
                },
            },
        });
    }

    async start(executionContext: IExecutionContext): Promise<void> {
        this.checkConfig();
        if(executionContext.contextType === "cli") {
            return;
        }

        const [coreWeb, umgmtGraphQl, coreGraphQl]
            = executionContext.extensionService.getExtensions("Core.Web", "Core.Usermgmt.GraphQL", "Core.GraphQL") as [CoreWeb, CoreUsermgmtGraphQL, CoreGraphQL];
        this.umgmtGql = umgmtGraphQl;
        const mainUrl = coreWeb.addScriptFromFile("Core.Dashboard.Main", "Core.Dashboard.Main.js");
        coreWeb.addAppRoute("/core.dashboard", mainUrl);

        coreGraphQl.registerExtension(this);
    }

    async stop(): Promise<void> {

    }

    // TODO: Implement this again
    registerDashboardPage(page: IDashboardPage): void {
        this.pages.push(page);
    }

    private checkConfig(): void {
        if(!this.config) {
            throw new Error(`Config could not be found at [${this.configLoader.configPath}]`);
        }
    }

    private loadConfig(): typeof this.config {
        const model = new CoreDashboardConfig();
        if(Object.keys(model).length === 0) return model;

        const [cfgname, templatename] = this.generateConfigNames();
        this.configLoader = new ConfigLoader(cfgname, templatename);
        const cfg = this.configLoader.createTemplateAndImport(model);

        return cfg;
    }

    private generateConfigNames(): string[] {
        return [
            ConfigLoader.createConfigPath(`${this.metadata.name}.json`),
            ConfigLoader.createConfigPath(`${this.metadata.name}.template.json`),
        ];
    }
}
