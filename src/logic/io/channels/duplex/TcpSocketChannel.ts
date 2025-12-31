import * as net from "node:net";
import IDuplexChannel from "./IDuplexChannel";

export default class TcpSocketChannel implements IDuplexChannel {
    private _socket: net.Socket;
    private _onMessageReceivedCallbacks: Set<(message: Buffer) => any> = new Set();
    private _handleMessageReceivedCallback: typeof this._handleMessageReceived = b => this._handleMessageReceived(b);

    constructor(socket: net.Socket) {
        this._socket = socket;
    }

    start(): Promise<void> {
        this._socket.on("data", this._handleMessageReceivedCallback);

        return Promise.resolve();
    }

    stop(): Promise<void> {
        this._socket.removeListener("data", this._handleMessageReceivedCallback);

        return Promise.resolve();
    }

    send(payload: Buffer): Promise<void> {
        this._socket.write(payload);
        return Promise.resolve();
    }

    onMessageReceived(callback: (message: Buffer) => any): void {
        this._onMessageReceivedCallbacks.add(callback);
    }

    removeOnMessageReceived(callback: (message: Buffer) => any): void {
        this._onMessageReceivedCallbacks.delete(callback);
    }

    private _handleMessageReceived(buffer: Buffer): void {
        for(const callback of this._onMessageReceivedCallbacks) {
            callback(buffer);
        }
    }
}
