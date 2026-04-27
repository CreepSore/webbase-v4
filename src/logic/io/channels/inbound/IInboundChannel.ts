import IIncomingMessage from "../../messages/IIncomingMessage";
import IMessageFactoryConsumer from "../../messages/IMessageFactoryConsumer";

export default interface IInboundChannel<T> extends IMessageFactoryConsumer {
    start(): Promise<void>;
    stop(): Promise<void>;

    onMessageReceived(callback: (message: IIncomingMessage<T>) => any): void;
    removeOnMessageReceived(callback: (message: IIncomingMessage<T>) => any): void;
}
