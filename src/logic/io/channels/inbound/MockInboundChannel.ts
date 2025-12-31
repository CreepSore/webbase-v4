import IInboundChannel from "./IInboundChannel";

export default class MockInboundChannel implements IInboundChannel {
    private _onMessageReceivedCallbacks: Set<(message: Buffer) => any> = new Set();

    start(): Promise<void> {
        return Promise.resolve();
    }

    stop(): Promise<void> {
        return Promise.resolve();
    }

    async handleMessage(message: Buffer): Promise<void> {
        for(const callback of this._onMessageReceivedCallbacks) {
            await callback(message);
        }
    }

    onMessageReceived(callback: (message: Buffer) => any): void {
        this._onMessageReceivedCallbacks.add(callback);
    }

    removeOnMessageReceived(callback: (message: Buffer) => any): void {
        this._onMessageReceivedCallbacks.delete(callback);
    }
}
