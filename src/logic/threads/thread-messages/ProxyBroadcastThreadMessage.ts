import ThreadMessage from "../ThreadMessage";

type ProxyBroadcastThreadMessagePayload = {
    proxyType: string;
    proxyId: string;
};

export default class ProxyBroadcastThreadMessage extends ThreadMessage<ProxyBroadcastThreadMessagePayload> {
    public static readonly type = "proxy-broadcast";
    
    constructor(proxyType: string, proxyId: string, sender: ProxyBroadcastThreadMessage["sender"] = "auto") {
        super(ProxyBroadcastThreadMessage.type, {
            proxyType,
            proxyId,
        }, sender);
    }
}
