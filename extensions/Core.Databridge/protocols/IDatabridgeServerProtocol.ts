import IDatabridgeSocket from "./IDatabridgeSocket";

export default interface IDatabridgeServerProtocol {
    start(): Promise<void>;
    stop(): Promise<void>;
    onClientConnected(callback: (client: IDatabridgeSocket) => void): this;
    onClientDisconnected(callback: (client: IDatabridgeSocket) => void): this;
}
