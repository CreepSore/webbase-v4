import {EventEmitter} from "events";

import IExecutionContext, { IAppExecutionContext, ICliExecutionContext } from "@service/extensions/IExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import ConfigLoader from "@logic/config/ConfigLoader";
import ActionMonitor from "./actions/ActionMonitor";
import Action from "./actions/Action";
import LogBuilder from "@service/logger/LogBuilder";

class CoreRepeatableActionsConfig {

}

export default class CoreRepeatableActions implements IExtension {
    metadata: ExtensionMetadata = {
        name: "Core.RepeatableActions",
        version: "1.0.0",
        description: "Provides an interface for managing repeatable actions",
        author: "ehdes",
        dependencies: ["Core"],
    };

    config: CoreRepeatableActionsConfig;
    configLoader: ConfigLoader<typeof this.config>;
    events: EventEmitter = new EventEmitter();
    monitor: ActionMonitor = new ActionMonitor();

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

    }

    private async startMain(executionContext: IAppExecutionContext): Promise<void> {

    }

    private checkConfig(): void {
        if(!this.config) {
            throw new Error(`Config could not be found at [${this.configLoader.configPath}]`);
        }
    }

    private loadConfig(): typeof this.config {
        const model = new CoreRepeatableActionsConfig();
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
