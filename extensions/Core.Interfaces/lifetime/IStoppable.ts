export default interface IStoppable {
    stop(): Promise<void>;
}
