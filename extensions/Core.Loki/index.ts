import {EventEmitter} from "events";

import ExecutionContext, { AppExecutionContext, CliExecutionContext, ThreadExecutionContext } from "@service/extensions/ExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import ConfigLoader from "@logic/config/ConfigLoader";
import LokiClient, { LokiConfig } from "./LokiClient";
import LoggerService from "../../src/service/logger/LoggerService";
import LokiLogger from "./LokiLogger";

class CoreLokiConfig {
    enabled: boolean = false;
    loki: LokiConfig = {
        endpoint: "https://loki",
        serviceName: "<PLACEHOLDER>",
        authentication: {
            enabled: false,
            username: "<PLACEHOLDER>",
            password: "<PLACEHOLDER>",
        },
    }
}

export default class CoreLoki implements IExtension {
    static metadata: ExtensionMetadata = {
        name: "Core.Loki",
        version: "1.0.0",
        description: "Loki Logging Module",
        author: "ehdes",
        dependencies: [],
        forceLoadInThreadContext: true,
    };

    metadata: ExtensionMetadata = CoreLoki.metadata;

    config: CoreLokiConfig = new CoreLokiConfig();
    events: EventEmitter = new EventEmitter();
    $: <T extends IExtension>(name: string|Function & { prototype: T }) => T;

    constructor() {
        this.config = this.loadConfig(true);
    }

    async start(executionContext: ExecutionContext): Promise<void> {
        this.checkConfig();

        if(!this.config.enabled) {
            return;
        }

        this.$ = <T extends IExtension>(name: string|Function & { prototype: T }) => executionContext.extensionService.getExtension(name) as T;
        if(executionContext.contextType === "cli") {
            await this.startCli(executionContext);
            return;
        }
        else if(executionContext.contextType === "app") {
            await this.startMain(executionContext);
            return;
        }
        else if(executionContext.contextType === "thread") {
            await this.startThread(executionContext);
            return;
        }
    }

    async stop(): Promise<void> {

    }

    private async startCli(executionContext: CliExecutionContext): Promise<void> {

    }

    private async startMain(executionContext: AppExecutionContext): Promise<void> {
        const lokiClient = new LokiClient(this.config.loki);
        LoggerService.addLogger(new LokiLogger(lokiClient));
    }

    private async startThread(executionContext: ThreadExecutionContext): Promise<void> {
        this.config.loki.serviceName = `${this.config.loki.serviceName}-${executionContext.application.id}`;

        const lokiClient = new LokiClient(this.config.loki);
        LoggerService.addLogger(new LokiLogger(lokiClient));
    }

    private checkConfig(): void {
        if(!this.config) {
            throw new Error(`Config could not be found at [${this.generateConfigNames()[0]}]`);
        }

        if(!this.config.enabled) {
            return;
        }

        if(this.config.loki.serviceName === "<PLACEHOLDER>") {
            throw new Error("Please specify a valid loki service name!");
        }

        if(this.config.loki.authentication.enabled) {
            if(this.config.loki.authentication.username === "<PLACEHOLDER>") {
                throw new Error("Please specify a valid loki authentication username!");
            }

            if(this.config.loki.authentication.password === "<PLACEHOLDER>") {
                throw new Error("Please specify a valid loki authentication password!");
            }
        }
    }

    private loadConfig(createDefault: boolean = false): typeof this.config {
        const [configPath, templatePath] = this.generateConfigNames();
        return ConfigLoader.initConfigWithModel(
            configPath,
            templatePath,
            new CoreLokiConfig(),
            createDefault,
        );
    }

    private generateConfigNames(): string[] {
        return [
            ConfigLoader.createConfigPath(`${this.metadata.name}.json`),
            ConfigLoader.createTemplateConfigPath(`${this.metadata.name}.json`),
        ];
    }
}
