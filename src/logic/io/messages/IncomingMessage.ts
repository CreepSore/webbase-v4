import IIO from "../IIO";
import IIncomingMessage from "./IIncomingMessage";

export default class IncomingMessage<TPayload> implements IIncomingMessage<TPayload> {
    private _io: IIO;
    private _payload: TPayload;

    get payload(): TPayload {
        return this._payload;
    }

    constructor(io: IIO, payload: TPayload) {
        this._io = io;
        this._payload = payload;
    }

    respond<T>(payload: T): Promise<void> {
        return this._io.sendMessage(this._io.messageFactory.buildOutgoingMessage(this._io.messageFactory.prepareOutgoingPayload(payload)));
    }

    transformPayload<T>(callback: (payload: TPayload) => T): IIncomingMessage<T> {
        return new IncomingMessage(this._io, callback(this._payload));
    }
}
