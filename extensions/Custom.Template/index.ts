import ExecutionContext, { AppExecutionContext, CliExecutionContext, WorkerExecutionContext } from "@service/extensions/ExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import ConfigLoader from "@logic/config/ConfigLoader";
import Core from "@extensions/Core";

class CustomTemplateConfig {

}

export default class CustomTemplate implements IExtension {
    static metadata: ExtensionMetadata = {
        name: "Custom.Template",
        version: "1.0.0",
        description: "Template Module",
        author: "ehdes",
        dependencies: [Core],
    };

    metadata: ExtensionMetadata = CustomTemplate.metadata;

    config: CustomTemplateConfig = new CustomTemplateConfig();
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
        else if(executionContext.contextType === "worker") {
            await this.startWorkerApp(executionContext);
            return;
        }
    }

    async stop(): Promise<void> {

    }

    private async startCli(executionContext: CliExecutionContext): Promise<void> {

    }

    private async startMain(executionContext: AppExecutionContext): Promise<void> {

    }

    private async startWorkerApp(executionContext: WorkerExecutionContext): Promise<void> {

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
            new CustomTemplateConfig(),
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
