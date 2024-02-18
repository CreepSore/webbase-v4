import {EventEmitter} from "events";

import IExecutionContext from "@service/extensions/IExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import ConfigLoader from "@logic/config/ConfigLoader";
import CoreDb from "@extensions/Core.Db";
import mongoose from "mongoose";

class LoginError extends Error { }

class CoreUsermgmtConfig {

}

export default class CoreUsermgmt implements IExtension {
    static metadata: ExtensionMetadata = {
        name: "Core.Usermgmt",
        version: "2.0.0",
        description: "Usermanagement Module",
        author: "ehdes",
        dependencies: [CoreDb],
    };

    metadata: ExtensionMetadata = CoreUsermgmt.metadata;

    config: CoreUsermgmtConfig;
    events: EventEmitter = new EventEmitter();
    db: typeof mongoose;
    $: <T extends IExtension>(name: string|Function & { prototype: T }) => T;

    constructor() {
        this.config = this.loadConfig(true);
    }

    async start(executionContext: IExecutionContext): Promise<void> {
        this.checkConfig();
        this.$ = <T extends IExtension>(name: string|Function & { prototype: T }) => executionContext.extensionService.getExtension(name) as T;
        if(executionContext.contextType !== "app") {
            return;
        }

        const coreDb = this.$(CoreDb);
        this.db = coreDb.db;
        await this.setupSchema();
    }

    async stop(): Promise<void> {

    }

    private async setupSchema(): Promise<void> {

    }

    private checkConfig(): void {
        if(!this.config) {
            throw new Error(`Config could not be found at [${this.generateConfigNames()[0]}]`);
        }
    }

    private loadConfig(createDefault: boolean = false): typeof this.config {
        const [configPath, templatePath] = this.generateConfigNames();
        return ConfigLoader.initConfigWithModel(
            configPath,
            templatePath,
            new CoreUsermgmtConfig(),
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
