import IChannelRegistrate from "./channels/IChannelRegistrate";
import IMessageDispatcher from "./dispatcher/IMessageDispatcher";
import IIncomingMessage from "./messages/IIncomingMessage";
import IMessageFactory from "./messages/IMessageFactory";
import IMessageProcessor from "./messages/IMessageProcessor";
import IOutgoingMessage from "./messages/IOutgoingMessage";

export default interface IIO<TEnvelope> extends IMessageProcessor<TEnvelope, TEnvelope> {
    get messageFactory(): IMessageFactory;
    get channelRegistrate(): IChannelRegistrate;

    start(): Promise<void>;
    stop(): Promise<void>;

    sendMessage(message: IOutgoingMessage<TEnvelope>): Promise<void>;
    receiveMessage(): Promise<IIncomingMessage<TEnvelope>>;

    registerDispatcher(dispatcher: IMessageDispatcher): this;
}
