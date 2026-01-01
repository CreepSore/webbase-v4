import * as fs from "fs";
import * as process from "process";

import ExecutionContext, { CliExecutionContext } from "@service/extensions/ExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import LoggerService from "@service/logger/LoggerService";
import ConsoleLogger from "@service/logger/ConsoleLogger";
import FileLogger from "@service/logger/FileLogger";
import CacheLogger from "@service/logger/CacheLogger";
import ConfigLoader from "@logic/config/ConfigLoader";
import JsonFileLogger from "@service/logger/JsonFileLogger";
import LogBuilder from "@service/logger/LogBuilder";
import { runPlatformDependent } from "@service/utils/multiplatform";

class CoreConfig {
    logger = {
        consoleLogger: {
            prettyPrint: true,
        },
        jsonLogger: {
            enable: true,
            removeId: false,
        },
    };
}

export default class Core implements IExtension {
    static metadata: ExtensionMetadata = {
        name: "Core",
        version: "1.0.0",
        description: "Core Module",
        author: "ehdes",
        dependencies: [],
        forceLoadInThreadContext: true,
    };

    metadata: ExtensionMetadata = Core.metadata;

    config: CoreConfig;
    hookedExceptions: boolean;

    constructor() {
        this.config = this.loadConfig(true);

        LoggerService.hookConsoleLog();
    }

    async start(executionContext: ExecutionContext): Promise<void> {
        if(!fs.existsSync("logs")) {
            fs.mkdirSync("logs");
        }

        if(executionContext.contextType === "thread") {
            // ChildApp logging is set up inside ThreadApplication.ts
            return;
        }

        LoggerService.addLogger(new ConsoleLogger(this.config.logger.consoleLogger.prettyPrint), "console");

        if(executionContext.contextType === "cli") {
            this.setupCli(executionContext);
            return;
        }

        if(executionContext.contextType !== "app") {
            return;
        }

        LoggerService
            .addLogger(new FileLogger(`logs/out_${new Date().toISOString().replace(/(\d+)-(\d+)-(\d+)T(\d+):(\d+):(\d+).(\d+)Z/, "$1_$2_$3_$4_$5")}.log`))
            .addLogger(new CacheLogger(), "cache");

        if(this.config.logger.jsonLogger.enable === true) {
            if(!fs.existsSync("jsonlogs")) {
                fs.mkdirSync("jsonlogs");
            }

            LoggerService
                .addLogger(new JsonFileLogger(
                    `jsonlogs/out_${new Date().toISOString().replace(/(\d+)-(\d+)-(\d+)T(\d+):(\d+):(\d+).(\d+)Z/, "$1_$2_$3_$4_$5")}.log`,
                    this.config.logger.jsonLogger.removeId,
                ));
        }

        if(process && !this.hookedExceptions) {
            this.hookedExceptions = true;

            process.on("uncaughtException", (error, origin) => {
                LogBuilder
                    .start()
                    .level(LogBuilder.LogLevel.CRITICAL)
                    .info("Core")
                    .line("CRITICAL ERROR OCCURED - PROGRAM WILL CRASH")
                    .object("error", error)
                    .object("origin", origin)
                    .appendCallStack()
                    .done();

                process.exit(1);
            });

            process.on("unhandledRejection", (reason, promise) => {
                LogBuilder
                    .start()
                    .level(LogBuilder.LogLevel.CRITICAL)
                    .info("Core")
                    .line("UNHANDLED REJECTION OCCURED - PROGRAM WILL CRASH")
                    .object("reason", reason)
                    .object("promise", promise)
                    .appendCallStack()
                    .done();

                process.exit(1);
            });
        }
    }

    async stop(): Promise<void> {

    }

    private setupCli(executionContext: CliExecutionContext): void {
        executionContext.application.cmdHandler.registerCommand({
            triggers: ["help", "h", "?"],
            description: "Shows the help page",
            parameters: [{
                name: "cmd",
                description: "Name of the command you want to see the help of",
            }],
            examples: ["help", "help --cmd=<command>"],
            callback: (args, log) => {
                const cmd = args.lp;
                cmd || args.command;
                if(!cmd) {
                    log(executionContext.application.cmdHandler.getHelpPage());
                    return;
                }

                const command = executionContext.application.cmdHandler.getCommand(cmd);
                if(!command) {
                    log("Command does not exist");
                    return "ERROR_HANDLED_BY_COMMAND";
                }

                log(executionContext.application.cmdHandler.getHelpString(command));
            },
        });
    }

    private loadConfig(createDefault: boolean = false): typeof this.config {
        const [configPath, templatePath] = this.generateConfigNames();
        return ConfigLoader.initConfigWithModel(
            configPath,
            templatePath,
            new CoreConfig(),
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
