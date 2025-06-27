import IThreadMessageReceiver from "../IThreadMessageReceiver";
import IThreadMessageSender from "../IThreadMessageSender";
import ProxyActionResultThreadMessage from "../thread-messages/ProxyActionResultThreadMessage";
import ProxyActionThreadMessage from "../thread-messages/ProxyActionThreadMessage";
import ThreadMessage from "../ThreadMessage";
import IObjectProxyConnection from "./IObjectProxyConnection";

export default class ThreadReceivingObjectProxyConnection<TObject extends Object> implements IObjectProxyConnection, IThreadMessageReceiver {
    private underlyingObject: TObject;
    private sender: IThreadMessageSender;

    constructor(underlyingObject: TObject, sender: IThreadMessageSender) {
        this.underlyingObject = underlyingObject;
        this.sender = sender;
    }

    call<TReturnType, TArgs extends any[]>(functionName: string, ...args: TArgs): Promise<TReturnType> {
        // @ts-ignore
        const fn = this.underlyingObject[functionName] as Function;
        let result;

        if(args.length > 0) {
            result = fn.call(this.underlyingObject, ...args);
        }
        else {
            result = fn.call(this.underlyingObject);
        }

        return result;
    }

    get<TReturnType>(propertyName: string): Promise<TReturnType> {
        // @ts-ignore
        return this.underlyingObject[propertyName];
    }

    set<TReturnType, TValue = any>(propertyName: string, value: TValue): Promise<TReturnType> {
        // @ts-ignore
        return this.underlyingObject[propertyName] = value;
    }

    async receiveThreadMessage<TPayload = any>(message: ThreadMessage<TPayload>): Promise<void> {
        if(message.type !== ProxyActionThreadMessage.type) {
            return;
        }

        const actionMessage = message as ProxyActionThreadMessage;
        const p = actionMessage.payload;

        switch(p.type) {
            case "call": {
                try {
                    let result: any;

                    if(p.args.length > 0) {
                        result = await this.call(p.functionName, ...p.args);
                    }
                    else {
                        result = await this.call(p.functionName);
                    }

                    await this.sender.sendThreadMessage(new ProxyActionResultThreadMessage({
                        actionId: p.actionId,
                        type: "call",
                        functionName: p.functionName,
                        result,
                    }));
                }
                catch(err) {
                    await this.sender.sendThreadMessage(new ProxyActionResultThreadMessage({
                        actionId: p.actionId,
                        type: "error",
                        error: String(err),
                    }));
                }

                break;
            }

            case "get-property": {
                try {
                    const result = await this.get(p.propertyName);

                    await this.sender.sendThreadMessage(new ProxyActionResultThreadMessage({
                        actionId: p.actionId,
                        type: "set-property",
                        propertyName: p.propertyName,
                        result,
                    }));
                }
                catch(err) {
                    await this.sender.sendThreadMessage(new ProxyActionResultThreadMessage({
                        actionId: actionMessage.payload.actionId,
                        type: "error",
                        error: String(err),
                    }));
                }

                break;
            }

            case "set-property": {
                try {
                    const result = await this.set(p.propertyName, p.value);

                    await this.sender.sendThreadMessage(new ProxyActionResultThreadMessage({
                        actionId: p.actionId,
                        type: "set-property",
                        propertyName: p.propertyName,
                        result,
                    }));
                }
                catch(err) {
                    await this.sender.sendThreadMessage(new ProxyActionResultThreadMessage({
                        actionId: actionMessage.payload.actionId,
                        type: "error",
                        error: String(err),
                    }));
                }

                break;
            }

            default: {
                await this.sender.sendThreadMessage(new ProxyActionResultThreadMessage({
                    actionId: actionMessage.payload.actionId,
                    type: "error",
                    error: "Invalid action target specified.",
                }));

                break;
            }
        }
    }
}
