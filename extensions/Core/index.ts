import * as fs from "fs";
import IExecutionContext, { ICliExecutionContext } from "@service/extensions/IExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import LoggerService from "@service/logger/LoggerService";
import ConsoleLogger from "@service/logger/ConsoleLogger";
import FileLogger from "@service/logger/FileLogger";
import CacheLogger from "@service/logger/CacheLogger";

export default class Core implements IExtension {
    metadata: ExtensionMetadata = {
        name: "Core",
        version: "1.0.0",
        description: "Core Module",
        author: "ehdes",
        dependencies: []
    };

    async start(executionContext: IExecutionContext) {
        if(!fs.existsSync("logs")) {
            fs.mkdirSync("logs");
        }

        LoggerService
            .addLogger(new ConsoleLogger())
            .hookConsoleLog();

        if(executionContext.contextType === "cli") {
            this.setupCli(executionContext);
            return;
        }

        LoggerService
            .addLogger(new FileLogger(`logs/out_${new Date().toISOString().replace(/(\d+)-(\d+)-(\d+)T(\d+):(\d+):(\d+).(\d+)Z/, "$1_$2_$3_$4_$5")}.log`))
            .addLogger(new CacheLogger(), "cache");
    }

    async stop() {

    }

    private setupCli(executionContext: ICliExecutionContext) {
        executionContext.application.cmdHandler.registerCommand({
            triggers: ["help", "h", "?"],
            description: "Shows the help page",
            parameters: [{
                name: "cmd",
                description: "Name of the command you want to see the help of"
            }],
            examples: ["help", "help --cmd=<command>"],
            callback: (args) => {
                let cmd = args.lp
                cmd || args.command;
                if(!cmd) {
                    console.log(executionContext.application.cmdHandler.getHelpPage());
                    return;
                }

                let command = executionContext.application.cmdHandler.getCommand(cmd);
                if(!command) {
                    console.log("Command does not exist");
                    return "ERROR_HANDLED_BY_COMMAND";
                }

                console.log(executionContext.application.cmdHandler.getHelpString(command));
            }
        });
    }
}
