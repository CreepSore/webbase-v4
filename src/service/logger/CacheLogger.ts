import ILogEntry from "./ILogEntry";
import ILogger from "./ILogger";

/**
 * Logs all console.log calls into an array.
 */
export default class CacheLogger implements ILogger {
    maxEntries: number = 500;
    logEntries: {id: string, date: number, level: string, infos: string[], message: string, objects: any}[] = [];

    async log(log: ILogEntry): Promise<void> {
        if(!log.level) return;

        this.logEntries.push({
            id: log.id,
            date: log.date.getTime(),
            level: log.level,
            infos: log.infos,
            message: log.lines.join("\n"),
            objects: log.objects,
        });

        if(this.maxEntries > 0) {
            this.logEntries.splice(0, this.logEntries.length - this.maxEntries);
        }
    }

    clear(): void {
        this.logEntries = [];
    }
}
