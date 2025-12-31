import IDuplexChannel from "./channels/duplex/IDuplexChannel";
import IInboundChannel from "./channels/inbound/IInboundChannel";
import IOutboundChannel from "./channels/outbound/IOutboundChannel";
import IIncomingMessage from "./messages/IIncomingMessage";
import IMessageFactory from "./messages/IMessageFactory";
import IOutgoingMessage from "./messages/IOutgoingMessage";

export default interface IIO {
    get messageFactory(): IMessageFactory;

    start(): Promise<void>;
    stop(): Promise<void>;

    sendMessage(message: IOutgoingMessage<Buffer>): Promise<void>;
    receiveMessage(type: string): Promise<IIncomingMessage<Buffer>>;

    onMessageReceived(callback: (message: IIncomingMessage<Buffer>) => any): void;
    removeOnMessageReceived(callback: (message: IIncomingMessage<Buffer>) => any): void;

    registerInboundChannel(channel: IInboundChannel): this;
    registerOutboundChannel(channel: IOutboundChannel): this;
    registerDuplexChannel(channel: IDuplexChannel): this;
}
