import {EventEmitter} from "events";

import IExecutionContext from "@service/extensions/IExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import ConfigLoader from "@logic/config/ConfigLoader";
import * as knex from "knex";
import LogBuilder from "@service/logger/LogBuilder";

class CoreDbConfig {
    client: string = "sqlite3";
    connection = {
        filename: "./storage.db",
    };
}

export default class CoreDb implements IExtension {
    metadata: ExtensionMetadata = {
        name: "Core.Db",
        version: "1.0.0",
        description: "Core Database Module",
        author: "ehdes",
        dependencies: ["Core"],
    };

    config: CoreDbConfig;
    db: knex.Knex;
    configLoader: ConfigLoader<typeof this.config>;
    events: EventEmitter = new EventEmitter();

    constructor() {
        this.config = this.loadConfig();
    }

    async start(executionContext: IExecutionContext): Promise<void> {
        if(executionContext.contextType === "cli") return;
        // Don't load the DB if we aren't required by any extension
        if(!executionContext.extensionService.extensions.find(ext => ext.metadata.dependencies.includes(this.metadata.name))) return;
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

    private checkConfig(): void {
        if(!this.config) {
            throw new Error(`Config could not be found at [${this.configLoader.configPath}]`);
        }
    }

    // ! For aesthetic IntelliSense reasons we don't care about that rule here
    // eslint-disable-next-line no-shadow
    onDbLoaded(callback: (knex: knex.Knex) => void): void {
        this.events.on("db-loaded", callback);
    }

    private loadConfig(): typeof this.config {
        const model = new CoreDbConfig();
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
