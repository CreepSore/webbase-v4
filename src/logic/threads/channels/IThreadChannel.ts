export default interface IThreadChannel {
    start(): void;
    stop(): void;

    sendMessage(message: any): void;
    onMessageReceived(callback: (message: any) => any): void;
    removeOnMessageReceived(callback: (message: any) => any): void;
}
