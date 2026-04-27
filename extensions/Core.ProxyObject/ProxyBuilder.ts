import { set } from "mongoose";
import IIO from "../../src/logic/io/IIO";
import IIncomingMessage from "../../src/logic/io/messages/IIncomingMessage";
import ProxyReceiver from "./ProxyReceiver";

type Promisified<T> = {
    [P in keyof T]: T[P] extends (...args: infer A) => infer R
        ? (...args: A) => Promise<R>
        : Promise<T[P]>;
};

export type ProxyInvoker<T> = Promisified<T>;

export type ProxyMessage<TPayload> = {
    type: "proxy-invoke" | "proxy-invoke-response"
        | "proxy-value" | "proxy-value-response";
    data: TPayload;
};

export type ProxyInvokePayload<T = any> = {
    id: string;
    method: string;
    args?: any[];
};

export type ProxyValuePayload<T = any> = {
    id: string;
    field: string;
}

export type ProxyInvokeResponsePayload<T = any> = {
    id: string;
    method: string;
    return: T;
    isError?: boolean;
};

export type ProxyValueResponsePayload<T = any> = {
    id: string;
    field: string;
    return: T;
    isError?: boolean;
};

export default class ProxyBuilder<T extends object> {
    private _lastMessageId = 0;
    private _obj: T;
    private _io: IIO;

    constructor(obj: T, io: IIO) {
        this._obj = obj;
        this._io = io;
    }

    asSender(): ProxyInvoker<T> {
        const result: Record<keyof T, any> = {} as Record<keyof T, any>;

        for(const key of Object.keys(this._obj)) {
            const descriptor = Object.getOwnPropertyDescriptor(this._obj, key);

            if(
                !descriptor
                || !["boolean", "number", "string", "object"].includes(typeof descriptor.value)
            ) {
                continue;
            }

            const messageId = String(++this._lastMessageId);

            Object.defineProperty(result, key, {
                get: () => {
                    const responsePromise = Promise.race([
                        new Promise((_, rej) => setTimeout(() => rej(new Error("Proxy value timed out")), 5000)),
                        new Promise((res, rej) => {
                            const responseCallback = (message: IIncomingMessage<Buffer>) => {
                                const parsed = message.transformPayload<ProxyMessage<ProxyValueResponsePayload>>(b => JSON.parse(b.toString()));

                                if(parsed.payload.type !== "proxy-value-response" || parsed.payload.data.field !== key || parsed.payload.data.id !== messageId) {
                                    return;
                                }

                                this._io.removeOnMessageReceived(responseCallback);

                                if(parsed.payload.data.isError) {
                                    rej(parsed.payload.data.return);
                                    return;
                                }

                                res(parsed.payload.data.return);
                            }

                            this._io.onMessageReceived(responseCallback);
                        })
                    ]);

                    return this._io.messageFactory.buildOutgoingMessage<ProxyMessage<ProxyValuePayload>>({
                        type: "proxy-value",
                        data: {
                            id: messageId,
                            field: key,
                        }
                    }).send().then(() => responsePromise);
                }
            });
        }

        for(const key of Object.getOwnPropertyNames(Object.getPrototypeOf(this._obj))) {
            if(key === "constructor") {
                continue;
            }

            const fn = (...args: any[]) => {
                const messageId = String(++this._lastMessageId);

                const responsePromise = Promise.race([
                    new Promise((_, rej) => setTimeout(() => rej(new Error("Proxy method invocation timed out")), 5000)),
                    new Promise((res, rej) => {
                        const responseCallback = (message: IIncomingMessage<Buffer>) => {
                            const parsed = message.transformPayload<ProxyMessage<ProxyInvokeResponsePayload>>(b => JSON.parse(b.toString()));

                            if(parsed.payload.type !== "proxy-invoke-response" || parsed.payload.data.method !== key || parsed.payload.data.id !== messageId) {
                                return;
                            }

                            this._io.removeOnMessageReceived(responseCallback);

                            if(parsed.payload.data.isError) {
                                rej(parsed.payload.data.return);
                                return;
                            }

                            res(parsed.payload.data.return);
                        }

                        this._io.onMessageReceived(responseCallback);
                    })
                ]);

                return this._io.messageFactory.buildOutgoingMessage<ProxyMessage<ProxyInvokePayload>>({
                    type: "proxy-invoke",
                    data: {
                        id: messageId,
                        method: key,
                        args
                    }
                }).send().then(() => responsePromise);
            };

            if(typeof this._obj[key as keyof T] === "function") {
                result[key as keyof T] = (...args: any[]) => {
                    return fn(...args);
                }
            }
            else {
                Object.defineProperty(result, key, {
                    get: () => {
                        return fn();
                    }
                });
            }
        }

        return result as ProxyInvoker<T>;
    }

    asReceiver(): ProxyReceiver<T> {
        return new ProxyReceiver(this._obj, this._io) as ProxyReceiver<T>;
    }
}
