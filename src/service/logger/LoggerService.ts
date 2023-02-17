import ILogger from "./ILogger";


export default class LoggerService {
    static loggers: ILogger[] = [];
    static oldLog: (...data: any[]) => void = null;

    /**
     * Registers a new logger into the service.
     * @param {ILogger} logger
     * @param {string} [name]
     */
    static addLogger(logger: ILogger, name?: string) {
        logger.name = name;
        this.loggers.push(logger);
        return this;
    }

    /**
     * Calls the log function on all registered loggers.
     * @param {string} level
     * @param {...any[]} args
     */
    static async log(level: string, ...args: any[]) {
        await Promise.all(this.loggers.map(logger => logger.log(level, ...args)));
    }

    /**
     * Replaces console.log with our own loggers.
     * @memberof LoggerService
     */
    static hookConsoleLog() {
        this.oldLog = console.log;

        console.log = (level: string, ...args: any[]) => {
            this.log(level, ...args);
        }
    }

    /**
     * Gets a Logger by name
     * @param name
     */
    static getLogger(name: string): ILogger {
        return this.loggers.find(log => log.name === name);
    }

    /**
     * Unhooks console.log and replaces it with the original
     */
    static unhookConsoleLog() {
        if(!this.oldLog) return;

        console.log = this.oldLog;
        this.oldLog = null;
    }
}
