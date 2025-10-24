import IThreadIO from "../io/IThreadIO";
import IThreadMessage from "./IThreadMessage";

export default class IncomingThreadMessage<TPayload, TType extends string = string> implements IThreadMessage<TPayload, TType> {
    id: string;
    type: TType;
    payload: TPayload;
    private _io: IThreadIO;

    constructor(
        id: string,
        type: TType,
        payload: TPayload,
        io: IThreadIO = null
    ) {
        this.id = id;
        this.type = type;
        this.payload = payload;
        this._io = io;
    }

    respond<T>(payload: T, id: string = null) {
        this._io.messageFactory.buildResponseTelegram(this.id, payload, id).send();
    }

    toPayload(): IThreadMessage<TPayload, TType> {
        return {
            id: this.id,
            type: this.type,
            payload: this.payload,
        };
    }
}
