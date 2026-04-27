import IChannelRegistrate from "../channels/IChannelRegistrate";
import IInboundChannel from "../channels/inbound/IInboundChannel";
import IOutboundChannel from "../channels/outbound/IOutboundChannel";
import IIncomingMessage from "../messages/IIncomingMessage";
import IOutgoingMessage from "../messages/IOutgoingMessage";
import IMessageDispatcher from "./IMessageDispatcher";

export default class LambdaMessageDispatcher implements IMessageDispatcher {
    private _registrate: IChannelRegistrate | null = null;

    setChannelRegistrate(registrate: IChannelRegistrate): this {
        this._registrate = registrate;
        return this;
    }

    dispatchIncoming(message: IIncomingMessage<any>): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    dispatchOutgoing(message: IOutgoingMessage<any>): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
}
