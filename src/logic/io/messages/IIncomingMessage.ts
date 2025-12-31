import IMessage from "./IMessage";

export default interface IIncomingMessage<TPayload> extends IMessage<TPayload> {
    respond<T>(payload: T): Promise<void>;

    /**
     * Transforms the payload and returns a new message instance with the new payload
     */
    transformPayload<T>(callback: (payload: TPayload) => T): IIncomingMessage<T>;
}
