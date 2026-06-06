import LogBuilder from "../../../src/service/logger/LogBuilder";

export default interface ILoggingComponent {
    setLogger(log: LogBuilder | null): void;
}
