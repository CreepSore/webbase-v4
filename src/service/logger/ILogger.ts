
export default interface ILogger {
    name?: string;
    log(level: string, ...args: any[]): Promise<void>;
}
