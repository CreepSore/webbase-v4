import * as path from "path";
import {EventEmitter} from "events";

import * as express from "express";

import IApplication from "./IApplication";
import ConfigLoader from "@logic/config/ConfigLoader";
import ConfigModel from "@logic/config/ConfigModel";
import ExtensionService from "@service/extensions/ExtensionService";

export default class MainAppliation implements IApplication {
    app: express.Express;
    configLoader: ConfigLoader<ConfigModel>;
    events: EventEmitter;

    async start() {
        this.events = new EventEmitter();
        let config = this.loadConfig();
        this.events.emit("config-loaded", config);

        let extensionService = new ExtensionService();
        extensionService.setContextInfo({
            contextType: "app",
            application: this,
            extensionService
        });
        await extensionService.loadExtensions();
        extensionService.startExtensions();

        this.app = express();
        this.events.emit("express-loaded", this.app);
        this.app.listen(config.port, config.hostname);

        console.log("[INFO]", "Main Application Startup successful.");
    }

    async stop() {
        
    }

    loadConfig() {
        this.configLoader = new ConfigLoader(ConfigLoader.createConfigPath("config.json"), ConfigLoader.createConfigPath("config.template.json"));
        let config = this.configLoader.createTemplateAndImport(new ConfigModel());

        if(!config) {
            throw new Error(`Config does not exist at [${this.configLoader.configPath}]`);
        }
        return config;
    }

    onConfigLoaded(callback: (config: ConfigModel) => void) {
        this.events.on("config-loaded", callback);
        return this;
    }

    onExpressStart(callback: (app: express.Express) => void) {
        this.events.on("express-loaded", callback);
        return this;
    }
}
