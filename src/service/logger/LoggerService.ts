import ILogger from "./ILogger";


export default class LoggerService {
    static loggers: ILogger[] = [];
    static oldLog: (...data: any[]) => void = null;

    static addLogger(logger: ILogger) {
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

    static unhookConsoleLog() {
        if(!this.oldLog) return;

        console.log = this.oldLog;
        this.oldLog = null;
    }
}
