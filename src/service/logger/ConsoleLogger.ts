import ILogger from "./ILogger";
import LoggerService from "./LoggerService";

/**
 * Logs all console.log calls into the console as a formatted string.
 */
export default class ConsoleLogger implements ILogger {
    async log(level: string, ...args: any[]) {
        let infos = [...args].slice(0, args.length - 1);

        let message: string = args[args.length - 1];
        let formatted = `[${new Date().toISOString()}][${level.toUpperCase().padStart(8, " ")}]${infos.map(i => `[${i}]`).join("")} ${message}`;

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
