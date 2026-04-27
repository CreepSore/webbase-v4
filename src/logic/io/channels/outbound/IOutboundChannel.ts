import IMessageFactoryConsumer from "../../messages/IMessageFactoryConsumer";
import IOutgoingMessage from "../../messages/IOutgoingMessage";

export default interface IOutboundChannel<T> extends IMessageFactoryConsumer  {
    start(): Promise<void>;
    stop(): Promise<void>;
    send(payload: IOutgoingMessage<T>): Promise<void>;
}
