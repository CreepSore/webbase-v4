import ILogEntry from "../../src/service/logger/ILogEntry";
import ILogger from "../../src/service/logger/ILogger";
import LokiClient from "./LokiClient";

export default class LokiLogger implements ILogger {
    private lokiClient: LokiClient;

    constructor(lokiClient: LokiClient) {
        this.lokiClient = lokiClient;
    }

    async log(log: ILogEntry): Promise<void> {
        const logObj: any = {
            level: log.level,
            info: (log.infos || []),
            message: (log.lines || []),
            objects: log.objects,
        };

        try {
            const cache: any[] = [];

            const stringified = JSON.stringify(logObj, (key, value) => {
                if (typeof value === "object" && value !== null && !cache.includes(value)) {
                    cache.push(value);
                }
                return value;
            });

            await this.lokiClient.pushLog({
                date: log.date,
                level: log.level,
                message: stringified,
            });
        }
        catch {}
    }
}
