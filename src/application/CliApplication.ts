import {EventEmitter} from "events";
import IApplication from "./IApplication";
import ConfigLoader from "@logic/config/ConfigLoader";
import ConfigModel from "@logic/config/ConfigModel";
import ExecutionContext, { CliExecutionContext } from "@service/extensions/ExecutionContext";
import CommandHandler from "./CommandHandler";

import minimist from "minimist";

import readline from "readline";
import ExtensionServiceFactory from "../service/extensions/ExtensionServiceFactory";
import IExtensionService from "../service/extensions/IExtensionService";

export default class CliApplication implements IApplication {
    configLoader: ConfigLoader<ConfigModel>;
    events: EventEmitter = new EventEmitter();
    extensionService: IExtensionService = ExtensionServiceFactory.create();
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

        const executionContext = {
            contextType: "cli",
            application: this,
            extensionService: this.extensionService,
        } as CliExecutionContext;
        this.extensionService.initialize(executionContext);

        try {
            for(const environment of await ExtensionServiceFactory.createDefaultEnvironments()) {
                await environment.applyTo(this.extensionService);
            }
        }
        catch {
            console.log("ERROR", "CliApplication.ts", "Failed to load some extensions. Please check installed npm packages");
        }

        try {
            await this.extensionService.loadExtensions();
            await this.extensionService.startExtensions();
        }
        catch {
            console.log("ERROR", "CliApplication.ts", "Failed to start extensions. Please check installed npm packages");
        }

        this.events.emit("after-startup", executionContext);

        if(isInteractive) {
            await this.startInteractive();
        }
        else {
            const exitCode = await this.handleCli();
            process.exit(exitCode);
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

    private async handleCli(): Promise<number> {
        const execResult = await this.cmdHandler.triggerArgs(this.args);
        console.log(execResult.log);

        if(execResult.result) {
            return 1;
        }

        return 0;
    }

    onConfigLoaded(callback: (config: ConfigModel) => void): this {
        this.events.on("config-loaded", callback);
        return this;
    }

    onAfterStartup(callback: (context: ExecutionContext) => void): this {
        this.events.on("after-startup", callback);
        return this;
    }
}
