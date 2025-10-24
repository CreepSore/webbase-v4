import * as workerThreads from "node:worker_threads";
import * as events from "node:events";

import IThreadChannel from "./IThreadChannel";

export default class ThreadMessagePortChannel implements IThreadChannel {
    private _eventEmitter: events.EventEmitter = new events.EventEmitter();
    private _port: workerThreads.MessagePort;
    private _onMessageReceivedCallback: (message: any) => void;

    constructor(port: ThreadMessagePortChannel["_port"]) {
        this._port = port;
    }

    start(): void {
        this._onMessageReceivedCallback = (message) => this.fireOnMessageReceived(message);
        this._port.on("message", this._onMessageReceivedCallback);
    }

    stop(): void {
        this._eventEmitter.removeAllListeners();
        this._port.removeListener("message", this._onMessageReceivedCallback);
    }

    sendMessage(message: any): void {
        this._port.postMessage(message);
    }

    onMessageReceived(callback: (message: any) => any): void {
        this._eventEmitter.on("message", callback);
    }

    removeOnMessageReceived(callback: (message: any) => any): void {
        this._eventEmitter.removeListener("message", callback);
    }

    private fireOnMessageReceived(message: any): void {
        this._eventEmitter.emit("message", message);
    }
}
