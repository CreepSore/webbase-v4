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

        const logDir = path.dirname(this.logfilePath);
        if(!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir);
        }
    }

    async log(log: ILogEntry): Promise<void> {
        const date = `[${log.date.toISOString()}]`;
        const level = log.level ? `[${log.level.padStart(8, " ")}]` : "";
        const infos = log.infos ? log.infos.map(i => `[${i}]`).join("") : "";
        const message = log.lines.join("\n");
        const objects = Object.entries(log.objects).map(([key, value]) => `[${key}: [${util.inspect(value, {breakLength: Infinity})}]`).join("");

        let formatted = `${date}${level}${infos} ${message}${objects ? ` @ ${objects}` : ""}\n`;

        if(infos.length === 0 && !message) {
            formatted = level;
        }

        fs.appendFileSync(this.logfilePath, formatted);
    }
}
