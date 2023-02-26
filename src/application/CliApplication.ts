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

    async start() {
        this.events = new EventEmitter();
        let config = this.loadConfig();
        this.events.emit("config-loaded", config);

        this.extensionService.setContextInfo({
            contextType: "cli",
            application: this,
            extensionService: this.extensionService
        });

        this.extensionService.skipLogs();

        try {
            await this.extensionService.loadExtensions();
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

        if(this.args.c !== null && !this.args.c) {
            await this.startInteractive();
        }
        else {
            await this.startCli();
        }
    }

    async stop() {
        await this.extensionService.stopExtensions();
    }

    private loadConfig() {
        this.configLoader = new ConfigLoader(ConfigLoader.createConfigPath("config.json"), ConfigLoader.createConfigPath("config.template.json"));
        let config = this.configLoader.createTemplateAndImport(new ConfigModel());

        if(!config) {
            throw new Error(`Config does not exist at [${this.configLoader.configPath}]`);
        }
        return config;
    }

    private async startInteractive() {
        console.log("Interactive Shell started");
        readline.createInterface({
            input: process.stdin,
            output: process.stdout
        }).addListener("line", async (line) => {
            if(!line) return;
            const result = await this.cmdHandler.triggerString(line);
            if(result === "INVALID_COMMAND") {
                console.log("This command does not exist.");
            }
            else if(result === "INVALID_USAGE") {
                console.log("Invalid usage of command");
            }
        });
    }

    private async startCli() {
        this.cmdHandler.triggerArgs(this.args);
    }

    onConfigLoaded(callback: (config: ConfigModel) => void) {
        this.events.on("config-loaded", callback);
        return this;
    }

    onAfterStartup(callback: (context: IExecutionContext) => void) {
        this.events.on("after-startup", callback);
        return this;
    }
}
