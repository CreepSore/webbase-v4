import IIncomingMessage from "../../messages/IIncomingMessage";
import IMessageFactory from "../../messages/IMessageFactory";
import IOutgoingMessage from "../../messages/IOutgoingMessage";
import IDuplexChannel from "./IDuplexChannel";

export default class EchoChannel implements IDuplexChannel<any> {
    private _messageFactory: IMessageFactory | null = null;
    private _onMessageReceivedCallbacks: Set<(message: IIncomingMessage<any>) => any> = new Set();

    setMessageFactory(messageFactory: IMessageFactory): void {
        this._messageFactory = messageFactory;
    }

    start(): Promise<void> {
        return Promise.resolve();
    }

    stop(): Promise<void> {
        return Promise.resolve();
    }

    onMessageReceived(callback: (message: IIncomingMessage<any>) => any): void {
        this._onMessageReceivedCallbacks.add(callback);
    }

    removeOnMessageReceived(callback: (message: IIncomingMessage<any>) => any): void {
        this._onMessageReceivedCallbacks.delete(callback);
    }

    async send(message: IOutgoingMessage<any>): Promise<void> {
        if(!this._messageFactory) {
            return;
        }

        for(const callback of this._onMessageReceivedCallbacks) {
            const outgoingMessage = this._messageFactory.buildIncomingMessage(structuredClone(message.payload));
            callback(outgoingMessage);
        }
    }
}
