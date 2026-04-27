import IDuplexChannel from "./IDuplexChannel";

export default class PartyChannel implements IDuplexChannel {
    private _channels: Map<string, IDuplexChannel> = new Map();
    private _subInboundChannels: Map<string, IDuplexChannel> = new Map();
    private _subOutboundChannels: Map<string, IDuplexChannel> = new Map();

    private _onMessageReceivedCallbacks: Set<(message: Buffer) => any> = new Set();
    private _handleMessageReceivedCallback: typeof this._handleMessageReceived = this._handleMessageReceived.bind(this);

    start(): Promise<void> {
        const toAwait: Promise<void>[] = [];

        for(const [key, value] of this._channels) {
            toAwait.push(value.start());
        }

        return Promise.all(toAwait).then(() => {});
    }

    stop(): Promise<void> {
        const toAwait: Promise<void>[] = [];

        for(const [key, value] of this._channels) {
            toAwait.push(value.stop());
        }

        return Promise.all(toAwait).then(() => {});
    }

    send(payload: Buffer): Promise<void> {
        throw new Error("Method not implemented.");
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
