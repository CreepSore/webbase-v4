import {EventEmitter} from "events";

import nodeCron from "node-cron";

import IExecutionContext, { IAppExecutionContext, ICliExecutionContext } from "@service/extensions/IExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import ConfigLoader from "@logic/config/ConfigLoader";
import Core from "@extensions/Core";
import CoreDb from "@extensions/Core.Db";
import CoreOAuth2 from "@extensions/Core.OAuth2";
import OAuthClient from "./models/OAuthClient";
import OAuthUser from "./models/OAuthUser";
import OAuthTokenCombo from "./models/OAuthTokenCombo";

class CoreOAuth2DbConfig {

}

export default class CoreOAuth2Db implements IExtension {
    static metadata: ExtensionMetadata = {
        name: "Core.OAuth2.Db",
        version: "1.0.0",
        description: "OAuth2 DB Module",
        author: "ehdes",
        dependencies: [Core, CoreDb, CoreOAuth2],
    };

    metadata: ExtensionMetadata = CoreOAuth2Db.metadata;

    config: CoreOAuth2DbConfig = new CoreOAuth2DbConfig();
    events: EventEmitter = new EventEmitter();
    $: <T extends IExtension>(name: string|Function & { prototype: T }) => T;
    tokenWatchdog: nodeCron.ScheduledTask;

    constructor() {
        this.config = this.loadConfig();
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
        this.tokenWatchdog.stop();
    }

    private async startCli(executionContext: ICliExecutionContext): Promise<void> {

    }

    private async startMain(executionContext: IAppExecutionContext): Promise<void> {
        const knex = this.$(CoreDb).db;
        await OAuthClient.setup(knex);
        await OAuthUser.setup(knex);
        await OAuthTokenCombo.setup(knex);

        this.tokenWatchdog = nodeCron.schedule("0 0 * * *", async() => {
            try {
                await OAuthTokenCombo.clearInvalid();
            }
            catch {
                // TODO: Error log
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
            new CoreOAuth2DbConfig(),
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
