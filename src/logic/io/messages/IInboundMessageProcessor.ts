import IIncomingMessage from "./IIncomingMessage";

export default interface IIncomingMessageProcessor<T> {
    processIncomingMessage(message: IIncomingMessage<T>): Promise<void>;
}
