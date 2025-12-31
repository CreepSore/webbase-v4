export default interface IInboundChannel {
    start(): Promise<void>;
    stop(): Promise<void>;

    onMessageReceived(callback: (message: Buffer) => any): void;
    removeOnMessageReceived(callback: (message: Buffer) => any): void;
}
