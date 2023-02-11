import ILogger from "./ILogger";
import LoggerService from "./LoggerService";

export default class ConsoleLogger implements ILogger {
    async log(level: string, ...args: any[]) {
        let infos = [...args].slice(0, args.length - 1);

        let message: string = args[args.length - 1];
        let formatted = `[${new Date().toISOString()}][${level.toUpperCase().padStart(8, " ")}]${infos.map(i => `[${i}]`).join("")} ${message}`;
        if(Boolean(LoggerService.oldLog)) {
            LoggerService.oldLog(formatted);
        }
        else {
            console.log(formatted);
        }
    }
}
