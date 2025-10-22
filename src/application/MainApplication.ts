import {EventEmitter} from "events";
import IApplication from "./IApplication";
import ConfigLoader from "@logic/config/ConfigLoader";
import ConfigModel from "@logic/config/ConfigModel";
import ExecutionContext, { AppExecutionContext } from "@service/extensions/ExecutionContext";
import CommandHandler from "./CommandHandler";
import IExtensionService from "../service/extensions/IExtensionService";
import ExtensionServiceFactory from "../service/extensions/ExtensionServiceFactory";

export default class MainAppliation implements IApplication {
    events: EventEmitter = new EventEmitter();
    extensionService: IExtensionService;
    cmdHandler: CommandHandler = new CommandHandler();
    started: boolean = false;
    executionContext: AppExecutionContext;

    async start(): Promise<void> {
        if(this.started) {
            return;
        }

        this.started = true;
        this.events = new EventEmitter();
        const config = this.loadConfig();
        this.events.emit("config-loaded", config);

        this.executionContext = {
            contextType: "app",
            application: this,
            extensionService: null,
        };

        this.extensionService = await ExtensionServiceFactory.fullCreateAndStart(
            this.executionContext,
            (message) => console.log("INFO", "ExtensionService", message)
        );

        console.log("INFO", "MainApplication.ts", "Main Application Startup successful.");
        this.events.emit("after-startup", this.executionContext);
    }

    async stop(): Promise<void> {
        if(!this.started) {
            return;
        }

        this.started = false;

        await this.extensionService.stopExtensions();

        console.log("INFO", "MainApplication.ts", "Main Application Stop successful.");
    }

    loadConfig(): ConfigModel {
        const templateModel = new ConfigModel();
        const config = ConfigLoader.initConfigWithModel(
            ConfigLoader.createConfigPath("config.json"),
            ConfigLoader.createTemplateConfigPath("config.json"),
            templateModel,
            true,
        );

        if(!config && Object.keys(templateModel).length > 0) {
            throw new Error("Main-Application Config does not exist");
        }
        return config;
    }

    onConfigLoaded(callback: (config: ConfigModel) => void): MainAppliation {
        this.events.on("config-loaded", callback);
        return this;
    }

    onAfterStartup(callback: (context: ExecutionContext) => void): MainAppliation {
        this.events.on("after-startup", callback);
        return this;
    }
}
