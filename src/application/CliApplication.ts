import {EventEmitter} from "events";
import IApplication from "./IApplication";
import ConfigLoader from "@logic/config/ConfigLoader";
import ConfigModel from "@logic/config/ConfigModel";
import ExtensionService from "@service/extensions/ExtensionService";
import IExecutionContext from "@service/extensions/IExecutionContext";
import CommandHandler from "./CommandHandler";

import minimist from "minimist";

import readline from "readline";

export default class CliApplication implements IApplication {
    configLoader: ConfigLoader<ConfigModel>;
    events: EventEmitter = new EventEmitter();
    extensionService: ExtensionService = new ExtensionService();
    args: minimist.ParsedArgs;
    cmdHandler: CommandHandler = new CommandHandler();

    constructor(args: minimist.ParsedArgs) {
        this.args = args;
    }

    async start(): Promise<void> {
        this.events = new EventEmitter();
        const config = this.loadConfig();

        const isInteractive
            = this.cmdHandler.isInteractive
            = this.args.c !== null && !this.args.c;

        this.events.emit("config-loaded", config);

        this.extensionService.setContextInfo({
            contextType: "cli",
            application: this,
            extensionService: this.extensionService,
        });

        this.extensionService.skipLogs();

        try {
            await this.extensionService.loadExtensionsFromExtensionsFolder();
        }
        catch {
            console.log("ERROR", "CliApplication.ts", "Failed to load some extensions. Please check installed npm packages");
        }

        try {
            await this.extensionService.startExtensions();
        }
        catch {
            console.log("ERROR", "CliApplication.ts", "Failed to start extensions. Please check installed npm packages");
        }

        this.events.emit("after-startup", this.extensionService.executionContext);

        if(isInteractive) {
            await this.startInteractive();
        }
        else {
            await this.startCli();
        }
    }

    async stop(): Promise<void> {
        await this.extensionService.stopExtensions();
    }

    private loadConfig(): ConfigModel {
        const templateModel = new ConfigModel();
        const config = ConfigLoader.initConfigWithModel(
            ConfigLoader.createConfigPath("config.json"),
            ConfigLoader.createTemplateConfigPath("config.json"),
            templateModel,
            true,
        );

        return config;
    }

    private async startInteractive(): Promise<void> {
        console.log("Interactive Shell started");
        readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        }).addListener("line", async(line) => {
            if(!line) return;
            const result = await this.cmdHandler.triggerString(line);
            if(result.result === "INVALID_COMMAND") {
                console.log("This command does not exist.");
            }
            else if(result.result === "INVALID_USAGE") {
                console.log("Invalid usage of command");
            }
        });
    }

    private async startCli(): Promise<void> {
        this.cmdHandler.triggerArgs(this.args);
    }

    onConfigLoaded(callback: (config: ConfigModel) => void): this {
        this.events.on("config-loaded", callback);
        return this;
    }

    onAfterStartup(callback: (context: IExecutionContext) => void): this {
        this.events.on("after-startup", callback);
        return this;
    }
}
