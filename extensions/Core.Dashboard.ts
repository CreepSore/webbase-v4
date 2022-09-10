import {EventEmitter} from "events";

import IExecutionContext from "@service/extensions/IExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import ConfigLoader from "@logic/config/ConfigLoader";
import CoreWeb from "./Core.Web";
import User from "./Core.Usermgmt/Models/User";

class TemplateConfig {

}

export default class CoreDashboard implements IExtension {
    metadata: ExtensionMetadata = {
        name: "Core.Dashboard",
        version: "1.0.0",
        description: "Dashboard Module",
        author: "ehdes",
        dependencies: ["Core.Web", "Core.Usermgmt"]
    };

    config: TemplateConfig;
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

        let coreWeb = executionContext.extensionService.getExtension("Core.Web") as CoreWeb;
        let mainScriptUrl = coreWeb.addScriptFromFile("Core.Dashboard.Main", "Core.Dashboard.Main.js");
        coreWeb.addAppRoute("/", mainScriptUrl);

        coreWeb.app.get("/user", async(req, res) => {
            res.json(await User.use().select());
        }).post("/user", async(req, res) => {
            res.json(await User.use().select().where(req.body));
        }).patch("/user", async(req, res) => {
            let userdata: Partial<User> = req.body;
            if(!userdata.id) return res.json({success: false}).end();

            let toSet = {...userdata};
            toSet.modified = new Date();
            delete toSet.id;

            res.json({success: true, result: await User.use().update(toSet).where({id: userdata.id})}).end();
        });
    }

    async stop() {
        
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
}

