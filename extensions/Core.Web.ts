import {EventEmitter} from "events";

import * as express from "express";

import IExecutionContext from "@service/extensions/IExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import ConfigModel from "@logic/config/ConfigModel";
import ConfigLoader from "@logic/config/ConfigLoader";

class CoreWebConfig {
    hostname: string = "127.0.0.1";
    port: number = 1325;
}

export default class Core implements IExtension {
    metadata: ExtensionMetadata = {
        name: "Core.Web",
        version: "1.0.0",
        description: "Core Web Module",
        author: "ehdes",
        dependencies: ["Core"]
    };

    config: CoreWebConfig;
    app: express.Express;
    configLoader: ConfigLoader<CoreWebConfig>;
    events: EventEmitter;

    constructor() {
        this.config = this.loadConfig();
    }

    async start(executionContext: IExecutionContext) {
        if(executionContext.contextType === "cli") return;
        if(!this.config) {
            throw new Error(`Config not found at [${this.configLoader.configPath}]`);
        }

        this.events = new EventEmitter();

        this.events.emit("config-loaded", this.config);

        this.app = express();
        this.events.emit("express-loaded", this.app);
        this.app.listen(this.config.port, this.config.hostname);
    }

    async stop() {

    }

    loadConfig() {
        this.configLoader = new ConfigLoader(ConfigLoader.createConfigPath("Core.Web.json"), ConfigLoader.createConfigPath("Core.Web.template.json"));
        let cfg = this.configLoader.createTemplateAndImport(new CoreWebConfig());

        return cfg;
    };
}
