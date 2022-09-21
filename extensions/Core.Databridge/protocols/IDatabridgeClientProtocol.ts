import IDatabridgeSocket from "./IDatabridgeSocket";

export default interface IDatabridgeClientProtocol extends IDatabridgeSocket {
    connect(): Promise<any>;
    disconnect(): Promise<any>;
    onConnected(callback: () => void): this;
    onDisconnected(callback: () => void): this;
}
