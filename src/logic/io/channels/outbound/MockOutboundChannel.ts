import IOutboundChannel from "./IOutboundChannel";

export default class MockOutboundChannel implements IOutboundChannel {
    private _sentCallback?: (payload: Buffer) => any;

    constructor(sentCallback: typeof this._sentCallback = undefined) {
        this._sentCallback = sentCallback;
    }

    setCallback(sentCallback: typeof this._sentCallback): void {
        this._sentCallback = sentCallback;
    }

    start(): Promise<void> {
        return Promise.resolve();
    }

    stop(): Promise<void> {
        return Promise.resolve();
    }

    send(payload: Buffer): Promise<void> {
        return this._sentCallback?.(payload);
    }
}
