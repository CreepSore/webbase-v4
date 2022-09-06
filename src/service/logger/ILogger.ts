
export default interface ILogger {
    log(level: string, ...args: any[]): Promise<void>;
}
