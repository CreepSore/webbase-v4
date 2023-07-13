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
import CoreUsermgmt from "@extensions/Core.Usermgmt";
import Core from "@extensions/Core";

export interface IDashboardPage {
    id: string;
    name: string;
    href: string;
    neededPermissions: string[];
}

class CoreDashboardConfig {

}

export default class CoreDashboard implements IExtension, IGraphQLExtension {
    static metadata: ExtensionMetadata = {
        name: "Core.Dashboard",
        version: "2.0.0",
        description: "Dashboard Module",
        author: "ehdes",
        dependencies: [Core, CoreUsermgmt, CoreUsermgmtGraphQL, CoreGraphQL, CoreWeb],
    };

    metadata: ExtensionMetadata = CoreDashboard.metadata;

    config: CoreDashboardConfig;
    events: EventEmitter = new EventEmitter();
    $: <T extends IExtension>(name: string|{prototype: T}) => T;

    pages: IDashboardPage[];
    umgmtGql: CoreUsermgmtGraphQL;


    constructor() {
        this.config = this.loadConfig(true);
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
        this.$ = <T extends IExtension>(name: string|{prototype: T}) => executionContext.extensionService.getExtension(name) as T;
        if(executionContext.contextType === "cli") {
            return;
        }

        const coreWeb = this.$(CoreWeb);
        const umgmtGraphQl = this.$(CoreUsermgmtGraphQL);
        const coreGraphQl = this.$(CoreGraphQL);
        const coreUsermgmt = this.$(CoreUsermgmt);

        await coreUsermgmt.createPermissions(...Object.values(Permissions));
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
            throw new Error(`Config could not be found at [${this.generateConfigNames()[0]}]`);
        }
    }

    private loadConfig(createDefault: boolean = false): typeof this.config {
        const [configPath, templatePath] = this.generateConfigNames();
        return ConfigLoader.initConfigWithModel(
            configPath,
            templatePath,
            new CoreDashboardConfig(),
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
