import {EventEmitter} from "events";

import IExecutionContext, { IAppExecutionContext, ICliExecutionContext } from "@service/extensions/IExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import ConfigLoader from "@logic/config/ConfigLoader";
import Core from "@extensions/Core";
import CoreMail from "@extensions/Core.Mail";
import CoreNotifications from "@extensions/Core.Notifications";
import MailNotificationProvider from "./MailNotificationProvider";

class CoreMailNotificationsConfig {
    enabled: boolean = false;
}

export default class CoreMailNotifications implements IExtension {
    static metadata: ExtensionMetadata = {
        name: "Core.Mail.Notifications",
        version: "1.0.0",
        description: "Template Module",
        author: "ehdes",
        dependencies: [Core, CoreMail, CoreNotifications],
    };

    metadata: ExtensionMetadata = CoreMailNotifications.metadata;

    config: CoreMailNotificationsConfig = new CoreMailNotificationsConfig();
    events: EventEmitter = new EventEmitter();
    $: <T extends IExtension>(name: string|Function & { prototype: T }) => T;

    constructor() {
        this.config = this.loadConfig(true);
    }

    async start(executionContext: IExecutionContext): Promise<void> {
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

    private async startCli(executionContext: ICliExecutionContext): Promise<void> {

    }

    private async startMain(executionContext: IAppExecutionContext): Promise<void> {
        if(!this.config.enabled) {
            return;
        }

        const coreNotifications = this.$(CoreNotifications);
        coreNotifications.registerNotificationProvider(new MailNotificationProvider(this.$(CoreMail)));
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
            new CoreMailNotificationsConfig(),
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
