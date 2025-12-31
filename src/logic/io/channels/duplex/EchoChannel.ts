import IDuplexChannel from "./IDuplexChannel";

export default class EchoChannel implements IDuplexChannel {
    private _onMessageReceivedCallbacks: Set<(message: Buffer) => any> = new Set();

    start(): Promise<void> {
        return Promise.resolve();
    }

    stop(): Promise<void> {
        return Promise.resolve();
    }

    onMessageReceived(callback: (message: Buffer) => any): void {
        this._onMessageReceivedCallbacks.add(callback);
    }

    removeOnMessageReceived(callback: (message: Buffer) => any): void {
        this._onMessageReceivedCallbacks.delete(callback);
    }

    send(payload: Buffer): Promise<void> {
        for(const callback of this._onMessageReceivedCallbacks) {
            return callback(payload);
        }
    }
}
