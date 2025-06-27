import ThreadMessage from "../ThreadMessage";

export type BaseProxyAction = {
    proxyId: string;
    actionId: string;
}

export type CallProxyAction = BaseProxyAction & {
    type: "call";
    functionName: string;
    args: any[];
};

export type GetProxyAction = BaseProxyAction & {
    type: "get-property";
    propertyName: string;
};

export type SetProxyAction = BaseProxyAction & {
    type: "set-property";
    propertyName: string;
    value: any;
};

export type ProxyActionThreadMessagePayload =
    CallProxyAction
    | GetProxyAction
    | SetProxyAction;

export default class ProxyActionThreadMessage extends ThreadMessage<ProxyActionThreadMessagePayload> {
    public static readonly type = "proxy-action";

    constructor(payload: ProxyActionThreadMessagePayload, sender: ProxyActionThreadMessage["sender"] = "auto") {
        super(ProxyActionThreadMessage.type, payload, sender);
    }
}
