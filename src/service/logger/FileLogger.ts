import * as fs from "fs";
import ILogger from "./ILogger";
import LoggerService from "./LoggerService";

export default class FileLogger implements ILogger {
    logfilePath: string;

    constructor(logPath: string) {
        this.logfilePath = logPath;
    }

    async log(level: string, ...args: any[]) {
        let infos = [...args].slice(0, args.length - 1);

        let message: string = args[args.length - 1];
        let formatted = `[${new Date().toISOString()}][${level.toUpperCase().padStart(8, " ")}]${infos.map(i => `[${i}]`)} ${message}\n`;
        fs.appendFileSync(this.logfilePath, formatted);
    }
}
