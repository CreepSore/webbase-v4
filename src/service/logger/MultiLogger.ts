import ILogEntry from "./ILogEntry";
import ILogger from "./ILogger";

export default class MultiLogger implements ILogger {
    private _loggers: Array<ILogger> = [];

    addLogger(logger: ILogger): this {
        this._loggers.push(logger);
        return this;
    }

    log(log: ILogEntry): Promise<void> {
        const promises = [];

        for(const logger of this._loggers) {
            promises.push(logger.log?.(log));
        }

        return Promise.all(promises.filter(Boolean)).then(() => {});
    }

    logSync(log: ILogEntry): void {
        for(const logger of this._loggers) {
            logger.logSync?.(log);
        }
    }
}
