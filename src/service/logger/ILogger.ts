
export default interface ILogger {
    /** Internal name of the logger */
    name?: string;
    /** Log function of the logger */
    log(level: string, ...args: any[]): Promise<void>;
}
