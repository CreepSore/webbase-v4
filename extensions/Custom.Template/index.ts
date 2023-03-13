import {EventEmitter} from "events";

import IExecutionContext from "@service/extensions/IExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import ConfigLoader from "@logic/config/ConfigLoader";

class TemplateConfig {

}

export default class CustomTemplate implements IExtension {
    metadata: ExtensionMetadata = {
        name: "Custom.Template",
        version: "1.0.0",
        description: "Template Module",
        author: "ehdes",
        dependencies: ["Core"],
    };

    config: TemplateConfig;
    configLoader: ConfigLoader<typeof this.config>;
    events: EventEmitter = new EventEmitter();

    constructor() {
        this.config = this.loadConfig();
    }

    async start(executionContext: IExecutionContext) {
        this.checkConfig();
        if(executionContext.contextType === "cli") {
            this.startCli(executionContext);
            return;
        }
        else if(executionContext.contextType === "app") {
            this.startMain(executionContext);
            return;
        }
    }

    async stop() {

    }

    private startCli(executionContext: IExecutionContext) {

    }

    private startMain(executionContext: IExecutionContext) {

    }

    private checkConfig() {
        if(!this.config) {
            throw new Error(`Config could not be found at [${this.configLoader.configPath}]`);
        }
    }

    private loadConfig() {
        const model = new TemplateConfig();
        if(Object.keys(model).length === 0) return model;

        const [cfgname, templatename] = this.generateConfigNames();
        this.configLoader = new ConfigLoader(cfgname, templatename);
        const cfg = this.configLoader.createTemplateAndImport(model);

        return cfg;
    }

    private generateConfigNames() {
        return [
            ConfigLoader.createConfigPath(`${this.metadata.name}.json`),
            ConfigLoader.createConfigPath(`${this.metadata.name}.template.json`),
        ];
    }
}
