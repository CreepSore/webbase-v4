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
        dependencies: ["Core"]
    };

    config: TemplateConfig;
    configLoader: ConfigLoader<typeof this.config>;
    events: EventEmitter = new EventEmitter();

    constructor() {
        this.config = this.loadConfig(false);
    }

    async start(executionContext: IExecutionContext) {
        
    }

    async stop() {
        
    }

    private loadConfig(errorOnNonExistingConfig: boolean = true) {
        let model = new TemplateConfig();
        if(Object.keys(model).length === 0) return model;

        let [cfgname, templatename] = this.generateConfigNames();
        this.configLoader = new ConfigLoader(cfgname, templatename);
        let cfg = this.configLoader.createTemplateAndImport(model);

        if(!cfg && errorOnNonExistingConfig) {
            throw new Error(`Config could not be found at [${this.configLoader.configPath}]`);
        }

        return cfg;
    }

    private generateConfigNames() {
        return [
            ConfigLoader.createConfigPath(`${this.metadata.name}.json`),
            ConfigLoader.createConfigPath(`${this.metadata.name}.template.json`)
        ];
    }
}
