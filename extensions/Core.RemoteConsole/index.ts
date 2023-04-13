import {EventEmitter} from "events";

import IExecutionContext, { IAppExecutionContext, ICliExecutionContext } from "@service/extensions/IExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import ConfigLoader from "@logic/config/ConfigLoader";
import RemoteConsoleClient from "./logic/RemoteConsoleClient";
import RemoteConsoleServer from "./logic/RemoteConsoleServer";
import LogBuilder from "@service/logger/LogBuilder";

class CoreRemoteConsoleConfig {
    enabled: boolean = false;
    host: string = "";
    port: number = 1444;
    secret: string = "";
}

export default class CoreRemoteConsole implements IExtension {
    metadata: ExtensionMetadata = {
        name: "Core.RemoteConsole",
        version: "1.0.0",
        description: "Remote CLI Module",
        author: "ehdes",
        dependencies: ["Core"],
    };

    config: CoreRemoteConsoleConfig;
    configLoader: ConfigLoader<typeof this.config>;
    events: EventEmitter = new EventEmitter();

    constructor() {
        this.config = this.loadConfig();
    }

    async start(executionContext: IExecutionContext): Promise<void> {
        this.checkConfig();
        if(executionContext.contextType === "cli") {
            await this.startCli(executionContext);
            return;
        }
        else if(executionContext.contextType === "app") {
            await this.startMain(executionContext);
            return;
        }
    }

    async stop(): Promise<void> {

    }

    private async startCli(executionContext: ICliExecutionContext): Promise<void> {
        if(executionContext.application.cmdHandler.isInteractive) return;
        executionContext.application.cmdHandler.registerCommand({
            triggers: ["remote-console"],
            callback: async(args) => {
                const client = new RemoteConsoleClient({
                    host: args.host || this.config.host,
                    port: args.port || this.config.port,
                    secret: args.secret || this.config.secret,
                });

                await client.start();
            },
        });
    }

    private async startMain(executionContext: IAppExecutionContext): Promise<void> {
        if(!this.config) return;
        if(!this.config.enabled) return;
        if(!this.config.host) return;
        if(!this.config.port) return;
        if(!this.config.secret) {
            LogBuilder
                .start()
                .level("WARN")
                .info("Core.RemoteConsole")
                .line("No secret set. Remote Console will not be enabled.")
                .done();
            return;
        }

        LogBuilder
            .start()
            .level("INFO")
            .info("Core.RemoteConsole")
            .line("Starting Remote Console")
            .debugObject("config", this.config)
            .done();

        const remoteConsoleServer = new RemoteConsoleServer({
            host: this.config.host,
            port: this.config.port,
            secret: this.config.secret,
            commandHandler: executionContext.application.cmdHandler,
        });

        await remoteConsoleServer.start();
    }

    private checkConfig(): void {
        if(!this.config) {
            throw new Error(`Config could not be found at [${this.configLoader.configPath}]`);
        }
    }

    private loadConfig(): typeof this.config {
        const model = new CoreRemoteConsoleConfig();
        if(Object.keys(model).length === 0) return model;

        const [cfgname, templatename] = this.generateConfigNames();
        this.configLoader = new ConfigLoader(cfgname, templatename);
        const cfg = this.configLoader.createTemplateAndImport(model);

        return cfg;
    }

    private generateConfigNames(): string[] {
        return [
            ConfigLoader.createConfigPath(`${this.metadata.name}.json`),
            ConfigLoader.createConfigPath(`${this.metadata.name}.template.json`),
        ];
    }
}
