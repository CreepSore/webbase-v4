import ThreadMessage from "../ThreadMessage";

export type BaseProxyAction = {
    actionId: string;
}

export type CallProxyActionResult<T = any> = BaseProxyAction & {
    type: "call";
    functionName: string;
    result: T
};

export type GetProxyActionResult<T = any> = BaseProxyAction & {
    type: "get-property";
    propertyName: string;
    result: T;
};

export type SetProxyActionResult<T = any> = BaseProxyAction & {
    type: "set-property";
    propertyName: string;
    result: T;
};

export type ErrorProxyActionResult<T = any> = BaseProxyAction & {
    type: "error";
    error: Error | string;
};

export type ProxyActionResultThreadMessagePayload<TResult> =
    CallProxyActionResult<TResult>
    | GetProxyActionResult<TResult>
    | SetProxyActionResult<TResult>
    | ErrorProxyActionResult;

export default class ProxyActionResultThreadMessage<TResult = any> extends ThreadMessage<ProxyActionResultThreadMessagePayload<TResult>> {
    public static readonly type = "proxy-action-result";

    constructor(payload: ProxyActionResultThreadMessagePayload<TResult>, sender: ProxyActionResultThreadMessage["sender"] = "auto") {
        super(ProxyActionResultThreadMessage.type, payload, sender);
    }
}
