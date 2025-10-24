import {EventEmitter} from "events";

import ExecutionContext from "@service/extensions/ExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import ConfigLoader from "@logic/config/ConfigLoader";
import LogBuilder from "@service/logger/LogBuilder";
import Core from "@extensions/Core";
import mongoose from "mongoose";

class CoreDbConfig {
    client: string = "mongodb";
    connection = {
        uri: "mongodb://localhost:27017/webbase-v4",
    };
}

export default class CoreDb implements IExtension {
    static metadata: ExtensionMetadata = {
        name: "Core.Db",
        version: "2.0.0",
        description: "Core Database Module",
        author: "ehdes",
        dependencies: [Core],
    };

    metadata: ExtensionMetadata = CoreDb.metadata;

    config: CoreDbConfig;
    db: typeof mongoose;
    configLoader: ConfigLoader<typeof this.config>;
    events: EventEmitter = new EventEmitter();

    constructor() {
        this.config = this.loadConfig(true);
    }

    async start(executionContext: ExecutionContext): Promise<void> {
        if(
            executionContext.contextType !== "app"
            && executionContext.contextType !== "thread"
        ) {
            return;
        }
        this.checkConfig();

        this.db = await mongoose.connect(this.config.connection.uri);

        LogBuilder
            .start()
            .level(LogBuilder.LogLevel.INFO)
            .info("Core.Db")
            .line("Initialized Connection to the Database")
            .debugObject("config", this.config.connection)
            .done();

        this.events.emit("db-loaded", this.db);
    }

    async stop(): Promise<void> {
        this.db.connection.close();
    }

    onDbLoaded(callback: (db: typeof mongoose) => void): void {
        this.events.on("db-loaded", callback);
    }

    private checkConfig(): void {
        if(!this.config) {
            throw new Error(`Config could not be found at [${this.generateConfigNames()[0]}]`);
        }
    }

    private loadConfig(createDefault: boolean = false): typeof this.config {
        const [configPath, templatePath] = this.generateConfigNames();
        const config = ConfigLoader.initConfigWithModel(
            configPath,
            templatePath,
            new CoreDbConfig(),
            createDefault,
        );

        return ConfigLoader.environmentOverride(config, "CoreDb");
    }

    private generateConfigNames(): string[] {
        return [
            ConfigLoader.createConfigPath(`${this.metadata.name}.json`),
            ConfigLoader.createTemplateConfigPath(`${this.metadata.name}.json`),
        ];
    }
}
