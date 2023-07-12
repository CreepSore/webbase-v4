import {EventEmitter} from "events";

import IExecutionContext, { IAppExecutionContext, ICliExecutionContext } from "@service/extensions/IExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import ConfigLoader from "@logic/config/ConfigLoader";
import INotificationProvider from "./logic/interfaces/INotificationProvider";
import LogBuilder from "@service/logger/LogBuilder";
import INotification from "./logic/interfaces/INotification";

class TemplateConfig {

}

export default class CoreNotifications implements IExtension {
    static metadata: ExtensionMetadata = {
        name: "Core.Notifications",
        version: "1.0.0",
        description: "Notifications Module",
        author: "ehdes",
        dependencies: ["Core"],
    };

    metadata: ExtensionMetadata = CoreNotifications.metadata;

    config: TemplateConfig = new TemplateConfig();
    events: EventEmitter = new EventEmitter();
    notificationProviders: Set<INotificationProvider> = new Set<INotificationProvider>();
    $: <T extends IExtension>(name: string) => T;

    constructor() {
        this.config = this.loadConfig();
    }

    async broadcastNotification(notification: INotification): Promise<void> {
        for(const notificationProvider of this.notificationProviders) {
            try {
                await notificationProvider.broadcastNotification(notification);
            }
            catch {
                LogBuilder
                    .start()
                    .level("ERROR")
                    .info(this.metadata.name)
                    .line(`Failed to send notification using provider of type ${notificationProvider.type}`)
                    .done();
            }
        }
    }

    registerNotificationProvider(provider: INotificationProvider): this {
        this.notificationProviders.add(provider);
        return this;
    }

    async start(executionContext: IExecutionContext): Promise<void> {
        this.checkConfig();
        this.$ = <T extends IExtension>(name: string) => executionContext.extensionService.getExtension(name) as T;
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
        executionContext.extensionService.onAllExtensionsStarted(async() => {
            for(const notificationProvider of this.notificationProviders) {
                try {
                    await notificationProvider.start();
                }
                catch {
                    LogBuilder
                        .start()
                        .level("ERROR")
                        .info(this.metadata.name)
                        .line(`Failed to start notification provider of type ${notificationProvider.type}`)
                        .done();
                    this.notificationProviders.delete(notificationProvider);
                }
            }
        });
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
            new TemplateConfig(),
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
