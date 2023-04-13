import {EventEmitter} from "events";
import IApplication from "./IApplication";
import ConfigLoader from "@logic/config/ConfigLoader";
import ConfigModel from "@logic/config/ConfigModel";
import ExtensionService from "@service/extensions/ExtensionService";
import IExecutionContext from "@service/extensions/IExecutionContext";
import CommandHandler from "./CommandHandler";

export default class MainAppliation implements IApplication {
    configLoader: ConfigLoader<ConfigModel>;
    events: EventEmitter = new EventEmitter();
    extensionService: ExtensionService = new ExtensionService();
    cmdHandler: CommandHandler = new CommandHandler();

    async start(): Promise<void> {
        this.events = new EventEmitter();
        const config = this.loadConfig();
        this.events.emit("config-loaded", config);

        this.extensionService.setContextInfo({
            contextType: "app",
            application: this,
            extensionService: this.extensionService,
        });
        await this.extensionService.loadExtensions();
        await this.extensionService.startExtensions();

        console.log("INFO", "MainApplication.ts", "Main Application Startup successful.");
        this.events.emit("after-startup", this.extensionService.executionContext);
    }

    async stop(): Promise<void> {
        await this.extensionService.stopExtensions();
    }

    loadConfig(): ConfigModel {
        const templateModel = new ConfigModel();
        this.configLoader = new ConfigLoader(ConfigLoader.createConfigPath("config.json"), ConfigLoader.createConfigPath("config.template.json"));
        const config = this.configLoader.createTemplateAndImport(templateModel);

        if(!config && Object.keys(templateModel).length > 0) {
            throw new Error(`Config does not exist at [${this.configLoader.configPath}]`);
        }
        return config;
    }

    onConfigLoaded(callback: (config: ConfigModel) => void): MainAppliation {
        this.events.on("config-loaded", callback);
        return this;
    }

    onAfterStartup(callback: (context: IExecutionContext) => void): MainAppliation {
        this.events.on("after-startup", callback);
        return this;
    }
}
