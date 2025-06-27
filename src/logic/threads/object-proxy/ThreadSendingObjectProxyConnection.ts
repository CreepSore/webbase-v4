import * as uuid from "uuid";

import IThreadMessageReceiver from "../IThreadMessageReceiver";
import IThreadMessageSender from "../IThreadMessageSender";
import ProxyActionResultThreadMessage from "../thread-messages/ProxyActionResultThreadMessage";
import ProxyActionThreadMessage from "../thread-messages/ProxyActionThreadMessage";
import ThreadMessage from "../ThreadMessage";
import IObjectProxyConnection from "./IObjectProxyConnection";

type ReceiveCallback<TMessageType extends ThreadMessage<any>> = (message: TMessageType) => Promise<void> | void;

export default class ThreadSendingObjectProxyConnection<TObject extends Object> implements IObjectProxyConnection, IThreadMessageReceiver {
    private sender: IThreadMessageSender;
    private proxyObjectId: string;
    private receiveCallbacks: Map<string, ReceiveCallback<any>> = new Map();

    constructor(proxyObjectId: string, sender: IThreadMessageSender) {
        this.sender = sender;
        this.proxyObjectId = proxyObjectId;
    }

    async call<TReturnType, TArgs extends any[]>(functionName: string, ...args: TArgs): Promise<TReturnType> {
        const actionId = uuid.v4();

        const waitPromise = this.waitForResultMessage(actionId);

        await this.sender.sendThreadMessage(new ProxyActionThreadMessage({
            proxyId: this.proxyObjectId,
            actionId,
            type: "call",
            functionName,
            args
        }));

        const resultMessage = await waitPromise;

        if(resultMessage.payload.type === "error") {
            this.handleErrorMessage(resultMessage);
            return;
        }

        return resultMessage.payload.result;
    }

    async get<TReturnType>(propertyName: string): Promise<TReturnType> {
        const actionId = uuid.v4();

        const waitPromise = this.waitForResultMessage(actionId);

        await this.sender.sendThreadMessage(new ProxyActionThreadMessage({
            proxyId: this.proxyObjectId,
            actionId,
            type: "get-property",
            propertyName
        }));

        const resultMessage = await waitPromise;

        if(resultMessage.payload.type === "error") {
            this.handleErrorMessage(resultMessage);
            return;
        }

        return resultMessage.payload.result;
    }

    async set<TReturnType, TValue = any>(propertyName: string, value: TValue): Promise<TReturnType> {
        const actionId = uuid.v4();

        const waitPromise = this.waitForResultMessage(actionId);

        await this.sender.sendThreadMessage(new ProxyActionThreadMessage({
            proxyId: this.proxyObjectId,
            actionId,
            type: "set-property",
            propertyName,
            value
        }));

        const resultMessage = await waitPromise;

        if(resultMessage.payload.type === "error") {
            this.handleErrorMessage(resultMessage);
            return;
        }

        return resultMessage.payload.result;
    }

    async receiveThreadMessage<TPayload = any>(message: ThreadMessage<TPayload>): Promise<void> {
        if(message.type !== ProxyActionResultThreadMessage.type) {
            return;
        }

        const p = (message.payload as ProxyActionResultThreadMessage).payload;

        const callback = this.receiveCallbacks.get(p.actionId);

        if(callback) {
            callback(message);
        }
    }

    waitForResultMessage(actionId: string): Promise<ProxyActionResultThreadMessage> {
        return new Promise(res => {
            const callback = (message: ProxyActionResultThreadMessage) => {
                this.receiveCallbacks.delete(actionId);
                res(message);
            };

            this.receiveCallbacks.set(actionId, callback);
        });

    }

    private handleErrorMessage(message: ProxyActionResultThreadMessage): void {
        if(message.payload.type !== "error") {
            return;
        }

        throw message.payload.error;
    }
}
