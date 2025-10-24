import IncomingThreadMessage from "../messages/IncomingThreadMessage";
import OutgoingThreadMessage from "../messages/OutgoingThreadMessage";
import ThreadMessageFactory from "../messages/ThreadMessageFactory";

export default interface IThreadIO {
    get messageFactory(): ThreadMessageFactory;

    start(): void;
    stop(): void;

    sendMessage<T>(message: OutgoingThreadMessage<T>): void;
    receiveMessage<T>(type: string): Promise<IncomingThreadMessage<T>>;
    receiveResponse<T>(id: string): Promise<T>;

    onMessageReceived<T>(callback: (message: IncomingThreadMessage<T>) => any): void;
    removeOnMessageReceived<T>(callback: (message: IncomingThreadMessage<T>) => any): void;
}
