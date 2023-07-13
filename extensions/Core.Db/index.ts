import {EventEmitter} from "events";

import IExecutionContext from "@service/extensions/IExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import ConfigLoader from "@logic/config/ConfigLoader";
import * as knex from "knex";
import LogBuilder from "@service/logger/LogBuilder";
import Core from "@extensions/Core";

class CoreDbConfig {
    client: string = "sqlite3";
    connection = {
        filename: "./storage.db",
    };
}

export default class CoreDb implements IExtension {
    static metadata: ExtensionMetadata = {
        name: "Core.Db",
        version: "1.0.0",
        description: "Core Database Module",
        author: "ehdes",
        dependencies: [Core],
    };

    metadata: ExtensionMetadata = CoreDb.metadata;

    config: CoreDbConfig;
    db: knex.Knex;
    configLoader: ConfigLoader<typeof this.config>;
    events: EventEmitter = new EventEmitter();

    constructor() {
        this.config = this.loadConfig(true);
    }

    async start(executionContext: IExecutionContext): Promise<void> {
        if(executionContext.contextType === "cli") return;
        this.checkConfig();

        const config = {...this.config};
        // @ts-ignore
        config.log = {
            warn(message: string) {
                console.log("WARN", "Knex", message);
            },
            error(message: string) {
                console.log("ERROR", "Knex", message);
            },
            deprecate(message: string) {
                console.log("DEPRECATE", "Knex", message);
            },
            debug(message: string) {
                console.log("DEBUG", "Knex", message);
            },
        };

        this.db = knex.knex(config);
        LogBuilder
            .start()
            .level("INFO")
            .info("Core.Db")
            .line("Initialized Connection to the Database")
            .debugObject("config", this.db.client.connectionSettings)
            .done();

        this.events.emit("db-loaded", this.db);
    }

    async stop(): Promise<void> {
        this.db.destroy();
    }

    // ! For aesthetic IntelliSense reasons we don't care about that rule here
    // eslint-disable-next-line no-shadow
    onDbLoaded(callback: (knex: knex.Knex) => void): void {
        this.events.on("db-loaded", callback);
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
            new CoreDbConfig(),
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
