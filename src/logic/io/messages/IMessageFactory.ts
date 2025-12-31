import IIO from "../IIO";
import IIncomingMessage from "./IIncomingMessage";
import IOutgoingMessage from "./IOutgoingMessage";

/**
 * Factory for all kinds of messages.
 * One instance per IO instance.
 */
export default interface IMessageFactory {
    setIo(io: IIO): void;

    buildIncomingMessage<T>(payload: T): IIncomingMessage<T>;
    buildOutgoingMessage<T>(payload: T): IOutgoingMessage<T>;

    /**
     * Converts the payload into a Buffer ready to be sent
     */
    prepareOutgoingPayload<T>(payload: T): Buffer;
}
