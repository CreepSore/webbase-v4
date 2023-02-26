import util from "util";

import ILogEntry from "./ILogEntry";
import ILogger from "./ILogger";
import LoggerService from "./LoggerService";

/**
 * Logs all console.log calls into the console as a formatted string.
 */
export default class ConsoleLogger implements ILogger {
    async log(log: ILogEntry) {
        let date = `[${log.date.toISOString()}]`;
        let level = log.level ? `[${log.level.padStart(8, " ")}]` : "";
        let infos = log.infos ? log.infos.map(i => `[${i}]`).join("") : "";
        let message = log.lines.join("\n");
        let objects = Object.entries(log.objects).map(([key, value]) => `[${key}: [${util.inspect(value, {breakLength: Infinity})}]`).join("");

        let formatted = `${date}${level}${infos} ${message}${objects ? ` @ ${objects}` : ""}`;

        if(infos.length === 0 && !message) {
            formatted = level;
        }

        if(Boolean(LoggerService.oldLog)) {
            LoggerService.oldLog(formatted);
        }
        else {
            console.log(formatted);
        }
    }
}
