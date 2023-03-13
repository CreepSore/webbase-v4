import ILogEntry from "./ILogEntry";
import ILogger from "./ILogger";
import LogBuilder from "./LogBuilder";


export default class LoggerService {
    static loggers: ILogger[] = [];
    static oldLog: (...data: any[]) => void = null;

    /**
     * Registers a new logger into the service.
     * @param {ILogger} logger
     * @param {string} [name]
     */
    static addLogger(logger: ILogger, name?: string): typeof LoggerService {
        logger.name = name;
        this.loggers.push(logger);
        return this;
    }

    /**
     * Calls the log function on all registered loggers.
     * @param {string} level
     * @param {...any[]} args
     */
    static async log(log: ILogEntry): Promise<void> {
        await Promise.all(this.loggers.map(logger => logger.log(log)));
    }

    /**
     * Replaces console.log with our own loggers.
     * @memberof LoggerService
     */
    static hookConsoleLog(): void {
        this.oldLog = console.log;
        LogBuilder.onDone = entry => {
            this.log(entry);
        };

        console.log = (level: string, ...args: any[]) => {
            const builder = LogBuilder.start();

            if(args.length > 0) {
                builder.level(level);
                args.slice(0, -1).forEach(info => builder.info(info));
                builder.line(args[args.length - 1]);
            }
            else {
                builder.line(level);
            }

            builder.done();
        };
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
    static unhookConsoleLog(): void {
        if(!this.oldLog) return;

        console.log = this.oldLog;
        this.oldLog = null;
    }
}
