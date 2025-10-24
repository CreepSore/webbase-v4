import IThreadIO from "../io/IThreadIO";
import IThreadMessage from "./IThreadMessage";

export default class OutgoingThreadMessage<TPayload, TType extends string = string> implements IThreadMessage<TPayload, TType> {
    id: string;
    type: TType;
    payload: TPayload;

    private _io: IThreadIO;

    constructor(id: string, type: TType, payload: TPayload, io: IThreadIO = null) {
        this.id = id;
        this.type = type;
        this.payload = payload;
        this._io = io;
    }

    send(): void {
        if(!this._io) {
            throw new Error("No IO attached to this message!");
        }

        this._io.sendMessage(this);
    }

    sendAndWaitForResponse<TResponse = any>(): Promise<TResponse> {
        const responsePromise = this._io.receiveResponse<TResponse>(this.id);
        this.send();
        return responsePromise;
    }

    waitForResponse<TResponse = any>(): Promise<TResponse> {
        return this._io.receiveResponse(this.id);
    }

    toPayload(): IThreadMessage<TPayload, TType> {
        return {
            id: this.id,
            type: this.type,
            payload: this.payload,
        };
    }
}
