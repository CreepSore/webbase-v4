export default interface IDatabridgeSocket<TData extends any, TRawSocket = any> {
    id: string;
    raw?: TRawSocket;

    sendData(data: TData): Promise<void>;
    onDataReceived(callback: ((data: TData) => Promise<void> | void)): void;

    removeAllListeners(): void;
}
