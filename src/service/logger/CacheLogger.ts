import * as uuid from "uuid";
import ILogger from "./ILogger";
import LoggerService from "./LoggerService";

export default class CacheLogger implements ILogger {
    maxEntries: number = -1;
    logEntries: {id: string, date: number, level: string, infos: string[], message: string}[] = [];

    async log(level: string, ...args: any[]) {
        let infos = [...args].slice(0, args.length - 1);

        let message: string = args[args.length - 1];
        let formatted = `[${new Date().toISOString()}][${level.toUpperCase().padStart(8, " ")}]${infos.map(i => `[${i}]`)} ${message}`;
        this.logEntries.push({
            id: uuid.v4(),
            date: Date.now(),
            level: level.toUpperCase(),
            infos,
            message
        });

        if(this.maxEntries > 0) {
            this.logEntries.splice(0, this.logEntries.length - this.maxEntries);
        }
    }

    clear() {
        this.logEntries = [];
    }
}
