import util from "util";
import * as fs from "fs";
import * as path from "path";
import ILogEntry from "./ILogEntry";
import ILogger from "./ILogger";

/**
 * Logs all console.log calls into a file where every line is one json log entry.
 */
export default class JsonFileLogger implements ILogger {
    logfilePath: string;

    constructor(logPath: string) {
        this.logfilePath = logPath;

        const logDir = path.dirname(this.logfilePath);
        if(!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir);
        }
    }

    async log(log: ILogEntry): Promise<void> {
        const objects: {[key: string]: string} = {};

        const logObj = {
            id: log.id,
            date: log.date.getTime(),
            level: log.level,
            infos: log.infos,
            message: log.lines,
            objects: log.objects,
        };

        let cache: any[] = [];
        fs.appendFileSync(this.logfilePath, `${JSON.stringify(logObj, (key, value) => {
            if (typeof value === 'object' && value !== null) {
            // Duplicate reference found, discard key
            if (cache.includes(value)) return;

            // Store value in our collection
            cache.push(value);
            }
            return value;
        })}\n`);
        cache = null;
    }
}
