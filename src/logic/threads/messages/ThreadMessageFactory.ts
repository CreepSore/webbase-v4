import * as uuid from "uuid";
import IThreadMessage from "./IThreadMessage";
import IThreadIO from "../io/IThreadIO";
import OutgoingThreadMessage from "./OutgoingThreadMessage";

export default class ThreadMessageFactory {
    private _io: IThreadIO;

    constructor(io: IThreadIO) {
        this._io = io;
    }

    buildReadyTelegram(): OutgoingThreadMessage<{}, "READY"> {
        return this.buildOutgoing("READY", {});
    }

    buildResponseTelegram<TPayload, TType extends string = string>(
        responseToId: string,
        payload: TPayload,
        id: string = null
    ): OutgoingThreadMessage<{responseToId: string, payload: TPayload}, "RESPONSE"> {
        return this.buildOutgoing("RESPONSE", {responseToId, payload}, id);
    }

    buildOutgoing<TPayload, TType extends string = string>(type: TType, payload: TPayload, id: string = null): OutgoingThreadMessage<TPayload, TType> {
        return new OutgoingThreadMessage(
            id ?? uuid.v4(),
            type,
            payload,
            this._io
        );
    }
}
