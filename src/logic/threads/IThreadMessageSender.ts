import ThreadMessage from "./ThreadMessage";

export default interface IThreadMessageSender {
    sendThreadMessage<TPayload = any>(message: ThreadMessage<TPayload>): Promise<void>;
}
