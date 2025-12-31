import IMessage from "./IMessage";

export default interface IOutgoingMessage<TPayload> extends IMessage<TPayload> {
    send(): Promise<void>;

    /**
     * Transforms the payload and returns a new message instance with the new payload
     */
    transformPayload<T>(callback: (payload: TPayload) => T): IOutgoingMessage<T>;
}
