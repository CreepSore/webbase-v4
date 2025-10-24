import * as workerThreads from "node:worker_threads";
import * as events from "node:events";

import IThreadChannel from "./IThreadChannel";

export default class ThreadMessagePortChannel implements IThreadChannel {
    private _eventEmitter: events.EventEmitter = new events.EventEmitter();
    private _worker: workerThreads.Worker;
    private _onMessageReceivedCallback: (message: any) => void;

    constructor(worker: ThreadMessagePortChannel["_worker"]) {
        this._worker = worker;
    }

    start(): void {
        this._onMessageReceivedCallback = (message) => this.fireOnMessageReceived(message);
        this._worker.on("message", this._onMessageReceivedCallback);
    }

    stop(): void {
        this._eventEmitter.removeAllListeners();
        this._worker.removeListener("message", this._onMessageReceivedCallback);
    }

    sendMessage(message: any): void {
        this._worker.postMessage(message);
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
