import {EventEmitter} from "events";
import IApplication from "./IApplication";
import ConfigLoader from "@logic/config/ConfigLoader";
import ConfigModel from "@logic/config/ConfigModel";
import ExtensionService from "@service/extensions/ExtensionService";
import IExecutionContext from "@service/extensions/IExecutionContext";
import CommandHandler from "./CommandHandler";

export default class ChildApplication implements IApplication {
    events: EventEmitter = new EventEmitter();
    extensionService: ExtensionService = new ExtensionService();
    cmdHandler: CommandHandler = new CommandHandler();

    childType: string;

    constructor(childType: string) {
        this.childType = childType;
    }

    async start(): Promise<void> {
        this.events = new EventEmitter();
        const config = this.loadConfig();
        this.events.emit("config-loaded", config);

        this.extensionService.setContextInfo({
            contextType: "child-app",
            application: this,
            extensionService: this.extensionService,
            childType: this.childType,
        });
        await this.extensionService.loadExtensionsFromExtensionsFolder();
        await this.extensionService.startExtensions();

        console.log("INFO", "ChildApplication.ts", "Child Application Startup successful.");
        this.events.emit("after-startup", this.extensionService.executionContext);
    }

    async stop(): Promise<void> {
        await this.extensionService.stopExtensions();
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
            // ! Throw Main-Application config error because factually, it is the main-application config.
            throw new Error("Main-Application Config does not exist");
        }
        return config;
    }

    onConfigLoaded(callback: (config: ConfigModel) => void): ChildApplication {
        this.events.on("config-loaded", callback);
        return this;
    }

    onAfterStartup(callback: (context: IExecutionContext) => void): ChildApplication {
        this.events.on("after-startup", callback);
        return this;
    }
}
