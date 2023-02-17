import {EventEmitter} from "events";

import IExecutionContext from "@service/extensions/IExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import ConfigLoader from "@logic/config/ConfigLoader";
import CoreWeb from "../Core.Web";

class CoreDashboardConfig {

}

export default class CoreDashboard implements IExtension {
    metadata: ExtensionMetadata = {
        name: "Core.Dashboard",
        version: "2.0.0",
        description: "Dashboard Module",
        author: "ehdes",
        dependencies: ["Core", "Core.Usermgmt.Web", "Core.GraphQL"]
    };

    config: CoreDashboardConfig;
    configLoader: ConfigLoader<typeof this.config>;
    events: EventEmitter = new EventEmitter();

    constructor() {
        this.config = this.loadConfig();
    }

    async start(executionContext: IExecutionContext) {
        this.checkConfig();
        if(executionContext.contextType === "cli") {
            return;
        }

        const coreWeb = executionContext.extensionService.getExtension("Core.Web") as CoreWeb;
        const mainUrl = coreWeb.addScriptFromFile("Core.Dashboard.Main", "Core.Dashboard.Main.js");
        coreWeb.addAppRoute("/core.dashboard", mainUrl);
    }

    async stop() {
        
    }

    private checkConfig() {
        if(!this.config) {
            throw new Error(`Config could not be found at [${this.configLoader.configPath}]`);
        }
    }

    private loadConfig() {
        let model = new CoreDashboardConfig();
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
