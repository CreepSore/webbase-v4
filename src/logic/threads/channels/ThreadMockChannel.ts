import * as events from "node:events";

import IThreadChannel from "./IThreadChannel";

export default class ThreadMockChannel implements IThreadChannel {
    private _eventEmitter: events.EventEmitter = new events.EventEmitter();

    mockOnMessageSent: (message: any) => void;

    start(): void {}

    stop(): void {
    }

    sendMessage(message: any): void {
        this.mockOnMessageSent?.(message);
    }

    mockReceiveMessage(message: any): void {
        this.fireOnMessageReceived(message);
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
