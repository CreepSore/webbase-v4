import * as net from "node:net";
import IDuplexChannel from "./IDuplexChannel";
import IOutgoingMessage from "../../messages/IOutgoingMessage";
import IIncomingMessage from "../../messages/IIncomingMessage";
import IMessageFactory from "../../messages/IMessageFactory";

type TIn = Buffer;
type TOut = any;

export default class TcpSocketChannel implements IDuplexChannel<TIn, TOut> {
    private _started: boolean = false;
    private _socket: net.Socket;
    private _onMessageReceivedCallbacks: Set<(message: IIncomingMessage<TIn>) => any> = new Set();
    private _handleMessageReceivedCallback: typeof this._handleMessageReceived = this._handleMessageReceived.bind(this);
    private _messageFactory: IMessageFactory | null = null;

    constructor(socket: net.Socket) {
        this._socket = socket;
    }

    setMessageFactory(messageFactory: IMessageFactory): void {
        this._messageFactory = messageFactory;
    }

    start(): Promise<void> {
        if(this._started) {
            return Promise.resolve();
        }

        if(!this._messageFactory) {
            throw new Error("No MessageFactory defined!");
        }

        this._socket.on("data", this._handleMessageReceivedCallback);

        this._started = true;

        return Promise.resolve();
    }

    stop(): Promise<void> {
        if(!this._started) {
            return Promise.resolve();
        }

        this._socket.removeListener("data", this._handleMessageReceivedCallback);

        this._started = false;

        return Promise.resolve();
    }

    send(message: IOutgoingMessage<TOut>): Promise<void> {
        this._socket.write(message.payload);
        return Promise.resolve();
    }

    onMessageReceived(callback: (message: IIncomingMessage<TIn>) => any): void {
        this._onMessageReceivedCallbacks.add(callback);
    }

    removeOnMessageReceived(callback: (message: IIncomingMessage<TIn>) => any): void {
        this._onMessageReceivedCallbacks.delete(callback);
    }

    private _handleMessageReceived(buffer: TIn): void {
        for(const callback of this._onMessageReceivedCallbacks) {
            callback(this._messageFactory!.prepareIncomingMessage(this._messageFactory!.buildIncomingMessage(buffer)));
        }
    }
}
