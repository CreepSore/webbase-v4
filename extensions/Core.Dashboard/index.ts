import {EventEmitter} from "events";

import IExecutionContext from "@service/extensions/IExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import ConfigLoader from "@logic/config/ConfigLoader";
import CoreWeb from "../Core.Web";
import LoggerService from "@service/logger/LoggerService";
import CacheLogger from "@service/logger/CacheLogger";
import CoreUsermgmt from "../Core.Usermgmt";

import Permissions from "./permissions";
import PermissionGroup from "../Core.Usermgmt/Models/PermissionGroup";
import Permission from "../Core.Usermgmt/Models/Permission";

class TemplateConfig {

}

export interface DashboardPage {
    key: string;
    label: string;
    url: string;
    parentMenuTitle?: string; // null = normal menu entry
    showInNavigation: boolean;
    permissions?: string[];
}

export default class CoreDashboard implements IExtension {
    metadata: ExtensionMetadata = {
        name: "Core.Dashboard",
        version: "1.0.0",
        description: "Dashboard Module",
        author: "ehdes",
        dependencies: ["Core.Usermgmt.Web"]
    };

    config: TemplateConfig;
    configLoader: ConfigLoader<typeof this.config>;
    events: EventEmitter = new EventEmitter();
    pages: DashboardPage[] = [];

    constructor() {
        this.config = this.loadConfig();
    }

    async start(executionContext: IExecutionContext) {
        this.checkConfig();
        if(executionContext.contextType === "cli") {
            return;
        }

        let coreWeb = executionContext.extensionService.getExtension("Core.Web") as CoreWeb;
        let coreUsermgmt = executionContext.extensionService.getExtension("Core.Usermgmt") as CoreUsermgmt;

        const [permViewLogs] = await coreUsermgmt.createPermissions(...Object.values(Permissions));
        await Promise.all(Object.values(Permissions).map(
            perm => PermissionGroup.addPermission({name: "Administrator"}, {name: perm.name})));

        let mainScriptUrl = coreWeb.addScriptFromFile("Core.Dashboard.Main", "Core.Dashboard.Main.js");
        coreWeb.addAppRoute("/core.dashboard/", mainScriptUrl);

        coreWeb.app.get("/api/core.dashboard/logs", async(req, res) => {
            if(!res.locals.additionalData.permissions.some((p: Permission) => p.name === Permissions.ViewLogs.name)) return res.json([]);
            res.json((LoggerService.getLogger("cache") as CacheLogger).logEntries);
        });

        coreWeb.app.get("/api/core.dashboard/pages", async(req, res) => {
            res.json(this.pages.filter(p => (p.permissions || []).every(perm => res.locals.additionalData.permissions.map((x: Permission) => x.name).includes(perm))))
        });
    }

    async stop() {
        
    }

    registerDashboardPage(page: DashboardPage) {
        console.log("INFO", "Core.Dashboard", `Registered new page [${page.key}]@[${page.url}]`);
        this.pages.push(page);
    }

    private checkConfig() {
        if(!this.config) {
            throw new Error(`Config could not be found at [${this.configLoader.configPath}]`);
        }
    }

    private loadConfig() {
        let model = new TemplateConfig();
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
};

