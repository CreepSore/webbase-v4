import {EventEmitter} from "events";

import ExecutionContext, { AppExecutionContext, CliExecutionContext } from "@service/extensions/ExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import ConfigLoader from "@logic/config/ConfigLoader";
import Core from "@extensions/Core";

class CoreFilesystemConfig {

}

export default class CoreFilesystem implements IExtension {
    static metadata: ExtensionMetadata = {
        name: "Core.Filesystem",
        version: "1.0.0",
        description: "Template Module",
        author: "ehdes",
        dependencies: [Core],
    };

    metadata: ExtensionMetadata = CoreFilesystem.metadata;

    config: CoreFilesystemConfig = new CoreFilesystemConfig();
    events: EventEmitter = new EventEmitter();
    $: <T extends IExtension>(name: string|Function & { prototype: T }) => T;

    constructor() {
        this.config = this.loadConfig();
    }

    async start(executionContext: ExecutionContext): Promise<void> {
        this.checkConfig();
        this.$ = <T extends IExtension>(name: string|Function & { prototype: T }) => executionContext.extensionService.getExtension(name) as T;
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

    private async startCli(executionContext: CliExecutionContext): Promise<void> {

    }

    private async startMain(executionContext: AppExecutionContext): Promise<void> {

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
            new CoreFilesystemConfig(),
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
