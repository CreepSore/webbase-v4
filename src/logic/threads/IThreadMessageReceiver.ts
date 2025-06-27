import ThreadMessage from "./ThreadMessage";

export default interface IThreadMessageReceiver {
    receiveThreadMessage<TPayload = any>(message: ThreadMessage<TPayload>): Promise<void>;
}
