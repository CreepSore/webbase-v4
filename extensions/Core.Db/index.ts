import {EventEmitter} from "events";

import IExecutionContext from "@service/extensions/IExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import ConfigLoader from "@logic/config/ConfigLoader";
import * as knex from "knex";
import MainApplication from "@app/MainApplication";

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
        dependencies: ["Core"]
    };

    config: CoreDbConfig;
    db: knex.Knex
    configLoader: ConfigLoader<typeof this.config>;
    events: EventEmitter = new EventEmitter();

    constructor() {
        this.config = this.loadConfig();
    }

    async start(executionContext: IExecutionContext) {
        if(executionContext.contextType === "cli") return;
        // Don't load the DB if we aren't required by any extension
        if(!executionContext.extensionService.extensions.find(ext => ext.metadata.dependencies.includes(this.metadata.name))) return;
        this.checkConfig();

        let config = {...this.config};
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
            }
        };

        this.db = knex.knex(config);
        console.log("INFO", "Core.Db", `Initialized Connection to the Database @ [${JSON.stringify(this.db.client.connectionSettings)}]`);
        this.events.emit("db-loaded", this.db);
    }

    async stop() {
        this.db.destroy();
    }

    private checkConfig() {
        if(!this.config) {
            throw new Error(`Config could not be found at [${this.configLoader.configPath}]`);
        }
    }

    private loadConfig() {
        this.configLoader = new ConfigLoader(ConfigLoader.createConfigPath("Core.Db.json"), ConfigLoader.createConfigPath("Core.Db.template.json"));
        let cfg = this.configLoader.createTemplateAndImport(new CoreDbConfig());

        return cfg;
    }

    onDbLoaded(callback: (knex: knex.Knex) => void) {
        this.events.on("db-loaded", callback);
    }
}
