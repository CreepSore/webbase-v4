import util from "util";
import * as fs from "fs";
import * as path from "path";
import ILogEntry from "./ILogEntry";
import ILogger from "./ILogger";

/**
 * Logs all console.log calls into a file as a formatted string.
 */
export default class FileLogger implements ILogger {
    logfilePath: string;

    constructor(logPath: string) {
        this.logfilePath = logPath;

        let logDir = path.dirname(this.logfilePath);
        if(!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir);
        }
    }

    async log(log: ILogEntry) {
        let date = `[${log.date.toISOString()}]`;
        let level = log.level ? `[${log.level.padStart(8, " ")}]` : "";
        let infos = log.infos ? log.infos.map(i => `[${i}]`).join("") : "";
        let message = log.lines.join("\n");
        let objects = Object.entries(log.objects).map(([key, value]) => `[${key}: [${util.inspect(value, {breakLength: Infinity})}]`).join("");

        let formatted = `${date}${level}${infos} ${message}${objects ? ` @ ${objects}` : ""}\n`;

        if(infos.length === 0 && !message) {
            formatted = level;
        }

        fs.appendFileSync(this.logfilePath, formatted);
    }
}
