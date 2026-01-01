import * as net from "node:net";
import IDuplexChannel from "./IDuplexChannel";

export default class TcpSocketChannel implements IDuplexChannel {
    private _started: boolean;
    private _socket: net.Socket;
    private _onMessageReceivedCallbacks: Set<(message: Buffer) => any> = new Set();
    private _handleMessageReceivedCallback: typeof this._handleMessageReceived = this._handleMessageReceived.bind(this);

    constructor(socket: net.Socket) {
        this._socket = socket;
    }

    start(): Promise<void> {
        if(this._started) {
            return;
        }

        this._socket.on("data", this._handleMessageReceivedCallback);

        this._started = true;

        return Promise.resolve();
    }

    stop(): Promise<void> {
        if(!this._started) {
            return;
        }

        this._socket.removeListener("data", this._handleMessageReceivedCallback);

        this._started = false;

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
