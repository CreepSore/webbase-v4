import {EventEmitter} from "events";
import IApplication from "./IApplication";
import ConfigLoader from "@logic/config/ConfigLoader";
import ConfigModel from "@logic/config/ConfigModel";
import ExtensionService from "@service/extensions/ExtensionService";

export default class MainAppliation implements IApplication {
    configLoader: ConfigLoader<ConfigModel>;
    events: EventEmitter = new EventEmitter();
    extensionService: ExtensionService = new ExtensionService();

    async start() {
        this.events = new EventEmitter();
        let config = this.loadConfig();
        this.events.emit("config-loaded", config);

        this.extensionService.setContextInfo({
            contextType: "app",
            application: this,
            extensionService: this.extensionService
        });
        await this.extensionService.loadExtensions();
        this.extensionService.startExtensions();

        console.log("INFO", "MainApplication.ts", "Main Application Startup successful.");
    }

    async stop() {
        await this.extensionService.stopExtensions();
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
}
