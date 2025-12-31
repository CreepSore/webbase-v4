import IIO from "../IIO";
import IOutgoingMessage from "./IOutgoingMessage";

export default class OutgoingMessage<TPayload> implements IOutgoingMessage<TPayload> {
    private _io: IIO;
    private _payload: TPayload;

    get payload(): TPayload {
        return this._payload;
    }

    constructor(io: IIO, payload: TPayload) {
        this._io = io;
        this._payload = payload;
    }

    send(): Promise<void> {
        return this._io.sendMessage(this.transformPayload(p => this._io.messageFactory.prepareOutgoingPayload(p)));
    }

    transformPayload<T>(callback: (payload: TPayload) => T): IOutgoingMessage<T> {
        return new OutgoingMessage(this._io, callback(this._payload));
    }
}
