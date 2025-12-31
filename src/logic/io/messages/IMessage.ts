export default interface IMessage<TPayload> {
    get payload(): TPayload;
}
