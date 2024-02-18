import {EventEmitter} from "events";
import * as fs from "fs";
import * as path from "path";

import IExecutionContext from "@service/extensions/IExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import ConfigLoader from "@logic/config/ConfigLoader";
import CoreWeb from "@extensions/Core.Web";
import LoggerService from "@service/logger/LoggerService";
import CacheLogger from "@service/logger/CacheLogger";

import Permissions from "./permissions";
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

export default class CoreDashboard implements IExtension {
    static metadata: ExtensionMetadata = {
        name: "Core.Dashboard",
        version: "2.0.0",
        description: "Dashboard Module",
        author: "ehdes",
        dependencies: [Core, CoreUsermgmt, CoreWeb],
    };

    metadata: ExtensionMetadata = CoreDashboard.metadata;

    config: CoreDashboardConfig;
    events: EventEmitter = new EventEmitter();
    $: <T extends IExtension>(name: string|Function & { prototype: T }) => T;

    pages: IDashboardPage[];

    constructor() {
        this.config = this.loadConfig(true);
        this.pages = [];
    }

    async start(executionContext: IExecutionContext): Promise<void> {
        this.checkConfig();
        this.$ = <T extends IExtension>(name: string|Function & { prototype: T }) => executionContext.extensionService.getExtension(name) as T;
        if(executionContext.contextType !== "app") {
            return;
        }
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
