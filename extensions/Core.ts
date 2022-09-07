import IExecutionContext from "@service/extensions/IExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import MainApplication from "@app/MainApplication";
import ConfigModel from "@logic/config/ConfigModel";
import LoggerService from "@service/logger/LoggerService";
import ConsoleLogger from "@service/logger/ConsoleLogger";
import FileLogger from "@service/logger/FileLogger";
import * as fs from "fs";

export default class Core implements IExtension {
    metadata: ExtensionMetadata = {
        name: "Core",
        version: "1.0.0",
        description: "Core Module",
        author: "ehdes",
        dependencies: []
    };

    async start(executionContext: IExecutionContext) {
        if(executionContext.contextType === "cli") return;

        if(!fs.existsSync("logs")) {
            fs.mkdirSync("logs");
        }

        LoggerService
            .addLogger(new ConsoleLogger())
            .addLogger(new FileLogger(`logs/out_${new Date().toISOString().replace(/(\d+)-(\d+)-(\d+)T(\d+):(\d+):(\d+).(\d+)Z/, "$1_$2_$3_$4_$5")}.log`))
            .hookConsoleLog();
    }

    async stop() {

    }
}
