import {EventEmitter} from "events";

import IExecutionContext, { IAppExecutionContext, IChildExecutionContext as IChildAppExecutionContext, ICliExecutionContext } from "@service/extensions/IExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import ConfigLoader from "@logic/config/ConfigLoader";
import Core from "@extensions/Core";
import CoreWeb from "@extensions/Core.Web";
import CoreUsermgmt from "@extensions/Core.Usermgmt";
import createAuthenticationRouter from "./routers/AuthenticationRouter";
import Urls from "./urls";
import AuthenticationHandler from "@extensions/Core.Usermgmt/handlers/AuthenticationHandler";
import createPermissionRouter from "./routers/PermissionRouter";

declare module "express-session" {
    interface SessionData {
        userId: string;
    }
}

class CoreUsermgmtWebConfig {

}

export default class CoreUsermgmtWeb implements IExtension {
    static metadata: ExtensionMetadata = {
        name: "Core.Usermgmt.Web",
        version: "2.0.0",
        description: "Usermanagement API Module",
        author: "ehdes",
        dependencies: [Core, CoreWeb, CoreUsermgmt],
    };

    metadata: ExtensionMetadata = CoreUsermgmtWeb.metadata;

    config: CoreUsermgmtWebConfig = new CoreUsermgmtWebConfig();
    events: EventEmitter = new EventEmitter();
    $: <T extends IExtension>(name: string|Function & { prototype: T }) => T;

    constructor() {
        this.config = this.loadConfig();
    }

    async start(executionContext: IExecutionContext): Promise<void> {
        this.checkConfig();
        this.$ = <T extends IExtension>(name: string|Function & { prototype: T }) => executionContext.extensionService.getExtension(name) as T;
        if(executionContext.contextType === "cli") {
            await this.startCli(executionContext);
            return;
        }
        else if(executionContext.contextType === "app") {
            await this.startMain(executionContext);
            return;
        }
        else if(executionContext.contextType === "child-app") {
            await this.startChildApp(executionContext);
            return;
        }
    }

    async stop(): Promise<void> {

    }

    private async startCli(executionContext: ICliExecutionContext): Promise<void> {

    }

    private async startMain(executionContext: IAppExecutionContext): Promise<void> {
        const coreWeb = this.$(CoreWeb);
        const coreUsermgmt = this.$(CoreUsermgmt);

        coreWeb.addAppRoute("/core.usermgmt.web/login", coreWeb.addScriptFromFile("Core.Usermgmt.Web.Main", "Core.Usermgmt.Web.js"));
        coreWeb.app.use(
            Urls.base,
            createAuthenticationRouter(),
            createPermissionRouter(),
        );
    }

    private async startChildApp(executionContext: IChildAppExecutionContext): Promise<void> {

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
            new CoreUsermgmtWebConfig(),
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
