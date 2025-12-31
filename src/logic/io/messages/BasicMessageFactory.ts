import IIO from "../IIO";
import IIncomingMessage from "./IIncomingMessage";
import IMessageFactory from "./IMessageFactory";
import IncomingMessage from "./IncomingMessage";
import IOutgoingMessage from "./IOutgoingMessage";
import OutgoingMessage from "./OutgoingMessage";

export default class BasicMessageFactory implements IMessageFactory {
    private _io: IIO;

    setIo(io: IIO): void {
        this._io = io;
    }

    buildIncomingMessage<T>(payload: T): IIncomingMessage<T> {
        return new IncomingMessage(this._io, payload);
    }

    buildOutgoingMessage<T>(payload: T): IOutgoingMessage<T> {
        return new OutgoingMessage(this._io, payload);
    }

    prepareOutgoingPayload<T>(payload: T): Buffer {
        let result: string;

        switch(typeof payload) {
            case "string":
                result = payload;
                break;

            case "object":
                result = JSON.stringify(payload);
                break;

            case "number":
            case "bigint":
            case "boolean":
            default:
                result = String(payload);
                break;
        }

        return Buffer.from(result);
    }
}
