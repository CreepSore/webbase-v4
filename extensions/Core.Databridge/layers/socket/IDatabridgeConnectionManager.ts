import IDatabridgeSocket from "./IDatabridgeSocket";

export default interface IDatabridgeConnectionManager<TData, TSocket extends IDatabridgeSocket<TData>> {
    get clients(): TSocket[];

    start(): Promise<void>;
    stop(): Promise<void>;

    onConnectionEstablished(callback: ((socket: TSocket) => any)): this;
    onConnectionDisconnected(callback: ((socket: TSocket) => any)): this;

    getSocketById(id: IDatabridgeSocket<TData>["id"]): TSocket;
}
