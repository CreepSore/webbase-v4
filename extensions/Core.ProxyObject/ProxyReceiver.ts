import IIO from "../../src/logic/io/IIO";
import IIncomingMessage from "../../src/logic/io/messages/IIncomingMessage";
import { ProxyInvokePayload, ProxyInvokeResponsePayload, ProxyMessage, ProxyValuePayload, ProxyValueResponsePayload } from "./ProxyBuilder";

export default class ProxyReceiver<T extends object> {
    private _obj: T;
    private _io: IIO;

    private _boundIoOnMessageReceived: typeof this._ioOnMessageReceived;

    constructor(obj: T, io: IIO) {
        this._obj = obj;
        this._io = io;
        this._boundIoOnMessageReceived = this._ioOnMessageReceived.bind(this);
    }

    start(): void {
        this._io.onMessageReceived(this._boundIoOnMessageReceived);
    }

    stop(): void {
        this._io.removeOnMessageReceived(this._boundIoOnMessageReceived);
    }

    invokeMethod(method: string, args?: any[]): any {
        const func = (this._obj as any)[method];

        if(typeof func !== "function") {
            throw new Error(`Method ${method} is not a function on the target object`);
        }

        return func.apply(this._obj, args);
    }

    getValue(field: string): any {
        if(!(field in this._obj)) {
            throw new Error(`Field ${field} does not exist on the target object`);
        }

        return (this._obj as any)[field];
    }

    private _ioOnMessageReceived = async (message: IIncomingMessage<Buffer>) => {
        const parsed = message.transformPayload<ProxyMessage<any>>(b => JSON.parse(b.toString()));

        switch(parsed.payload.type) {
            case "proxy-invoke": {
                const { id, method, args } = parsed.payload.data as ProxyInvokePayload;

                try {
                    await this._io.messageFactory.buildOutgoingMessage<ProxyMessage<ProxyInvokeResponsePayload>>({
                        type: "proxy-invoke-response",
                        data: {
                            id,
                            method,
                            return: await this.invokeMethod(method, args)
                        }
                    }).send();
                }
                catch(err) {
                    await this._io.messageFactory.buildOutgoingMessage<ProxyMessage<ProxyInvokeResponsePayload>>({
                        type: "proxy-invoke-response",
                        data: {
                            id,
                            method,
                            return: err instanceof Error ? err.message : String(err),
                            isError: true
                        }
                    }).send();
                }
                break;
            }

            case "proxy-value": {
                const { id, field } = parsed.payload.data as ProxyValuePayload;

                try {
                    await this._io.messageFactory.buildOutgoingMessage<ProxyMessage<ProxyValueResponsePayload>>({
                        type: "proxy-value-response",
                        data: {
                            id,
                            field,
                            return: await this.getValue(field)
                        }
                    }).send();
                }
                catch(err) {
                    await this._io.messageFactory.buildOutgoingMessage<ProxyMessage<ProxyValueResponsePayload>>({
                        type: "proxy-value-response",
                        data: {
                            id,
                            field,
                            return: err instanceof Error ? err.message : String(err),
                            isError: true,
                        }
                    }).send();
                }

                break;
            }

            default: break;
        }
    };
}
