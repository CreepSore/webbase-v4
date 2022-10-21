import ILogger from "./ILogger";


export default class LoggerService {
    static loggers: ILogger[] = [];
    static oldLog: (...data: any[]) => void = null;

    static addLogger(logger: ILogger, name?: string) {
        logger.name = name;
        this.loggers.push(logger);
        return this;
    }

    static async log(level: string, ...args: any[]) {
        await Promise.all(this.loggers.map(logger => logger.log(level, ...args)));
    }

    static hookConsoleLog() {
        this.oldLog = console.log;

        console.log = (level: string, ...args: any[]) => {
            this.log(level, ...args);
        }
    }

    static getLogger(name: string) {
        return this.loggers.find(log => log.name === name);
    }

    static unhookConsoleLog() {
        if(!this.oldLog) return;

        console.log = this.oldLog;
        this.oldLog = null;
    }
}
