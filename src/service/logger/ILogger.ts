import ILogEntry from "./ILogEntry";

export default interface ILogger {
    /** Internal name of the logger */
    name?: string;
    /** Log function of the logger */
    log?(log: ILogEntry): Promise<void>;
    /** Synchronzied log function of the logger */
    logSync?(log: ILogEntry): void;
}
