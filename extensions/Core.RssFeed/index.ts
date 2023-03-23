import {EventEmitter} from "events";

import IExecutionContext, { IAppExecutionContext, ICliExecutionContext } from "@service/extensions/IExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import ConfigLoader from "@logic/config/ConfigLoader";
import CoreWeb from "@extensions/Core.Web";
import RssFeed from "./RssFeed";
import CoreUsermgmtWeb from "@extensions/Core.Usermgmt.Web";
import CoreUsermgmt from "@extensions/Core.Usermgmt";

import Permissions from "./permissions";

class CoreRssFeedConfig {

}

export default class CoreRssFeed implements IExtension {
    metadata: ExtensionMetadata = {
        name: "Core.RssFeed",
        version: "1.0.0",
        description: "RSS Feed Module",
        author: "ehdes",
        dependencies: ["Core", "Core.Usermgmt.Web"],
    };

    config: CoreRssFeedConfig;
    configLoader: ConfigLoader<typeof this.config>;
    events: EventEmitter = new EventEmitter();

    rssFeed = new RssFeed();

    constructor() {
        this.config = this.loadConfig();
    }

    async start(executionContext: IExecutionContext): Promise<void> {
        this.checkConfig();
        if(executionContext.contextType === "cli") {
            await this.startCli(executionContext);
            return;
        }
        else if(executionContext.contextType === "app") {
            await this.startMain(executionContext);
            return;
        }
    }

    async stop(): Promise<void> {

    }

    private async startCli(executionContext: ICliExecutionContext): Promise<void> {

    }

    private async startMain(executionContext: IAppExecutionContext): Promise<void> {
        const coreWeb = executionContext.extensionService.getExtension("Core.Web") as CoreWeb;
        const coreUsermgmt = executionContext.extensionService.getExtension("Core.Usermgmt") as CoreUsermgmt;
        const coreUsermgmtWeb = executionContext.extensionService.getExtension("Core.Usermgmt.Web") as CoreUsermgmtWeb;

        await coreUsermgmt.createPermissions(...Object.values(Permissions));

        coreWeb.app.get("/feed", coreUsermgmtWeb.checkPermissions(Permissions.ViewRssFeed.name), async(req, res) => {
            const rssString = this.rssFeed.toRssString();
            res.set("Content-Type", "text/xml");
            res.send(rssString);
        });
    }

    private checkConfig(): void {
        if(!this.config) {
            throw new Error(`Config could not be found at [${this.configLoader.configPath}]`);
        }
    }

    private loadConfig(): typeof this.config {
        const model = new CoreRssFeedConfig();
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
