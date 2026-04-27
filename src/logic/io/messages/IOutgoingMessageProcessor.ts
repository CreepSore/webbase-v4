import IOutgoingMessage from "./IOutgoingMessage";

export default interface IOutgoingMessageProcessor<T> {
    processOutgoingMessage(message: IOutgoingMessage<T>): Promise<void>;
}
