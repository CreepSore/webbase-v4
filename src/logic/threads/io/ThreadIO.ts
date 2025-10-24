import * as events from "events";

import IThreadIO from "./IThreadIO";
import ThreadMessageResponsePayload from "../message-payload-types/ThreadMessageResponsePayload";
import IncomingThreadMessage from "../messages/IncomingThreadMessage";
import ThreadMessageFactory from "../messages/ThreadMessageFactory";
import IThreadMessage from "../messages/IThreadMessage";
import IThreadChannel from "../channels/IThreadChannel";
import OutgoingThreadMessage from "../messages/OutgoingThreadMessage";

export default class ThreadIO implements IThreadIO {
    private _started: boolean = false;
    private _receiveMessageCallback: (message: any) => void;
    private _receivePromiseMap: Map<string, Array<(message: any) => void>> = new Map();
    private _responsePromiseMap: Map<string, Array<(message: any) => void>> = new Map();
    private _messageFactory: ThreadMessageFactory;
    private _channel: IThreadChannel;
    private _eventEmitter: events.EventEmitter;

    get messageFactory(): ThreadMessageFactory {
        return this._messageFactory;
    }

    constructor(channel: IThreadChannel) {
        this._messageFactory = new ThreadMessageFactory(this);
        this._channel = channel;
        this._eventEmitter = new events.EventEmitter();
    }

    start(): void {
        if(this._started) {
            return;
        }

        if(!this._channel) {
            throw new Error("Can't start thread IO channel without any port!");
        }

        this._started = true;

        this._receiveMessageCallback = (message: IThreadMessage<any>) => this.handleMessageReceived(message);
        this._channel.onMessageReceived(this._receiveMessageCallback);
        this._channel.start();
    }

    stop(): void {
        if(!this._started) {
            return;
        }
        this._started = false;

        this._channel.stop();
        this._eventEmitter.removeAllListeners();
    }

    receiveResponse<T>(id: string): Promise<T> {
        let callback: (message: IThreadMessage<ThreadMessageResponsePayload<T>>) => void;
        if(!this._responsePromiseMap.has(id)) {
            this._responsePromiseMap.set(id, []);
        }

        const promise = new Promise<IThreadMessage<ThreadMessageResponsePayload<T>>>(res => {
            callback = res;
        });

        this._responsePromiseMap.get(id).push(callback);
        return promise.then(p => p.payload.payload);
    }

    sendMessage<T>(message: OutgoingThreadMessage<T>): void {
        this._channel.sendMessage(message.toPayload());
    }

    receiveMessage<T>(type: string): Promise<IncomingThreadMessage<T>> {
        let callback: (message: IncomingThreadMessage<T>) => void;
        if(!this._receivePromiseMap.has(type)) {
            this._receivePromiseMap.set(type, []);
        }

        const promise = new Promise<IncomingThreadMessage<T>>(res => {
            callback = res;
        });

        this._receivePromiseMap.get(type).push(callback);
        return promise;
    }

    private handleMessageReceived(message: any): void {
        if(!message.type) {
            return;
        }

        const parsedMessage = message as IThreadMessage<any>;
        const messageInstance = new IncomingThreadMessage(parsedMessage.id, parsedMessage.type, parsedMessage.payload, this);

        this.fireOnMessageReceived(messageInstance);

        if(message.type === "RESPONSE") {
            this.handleResponseMessageReceived(message);
            return;
        }

        const receiveCallbacks = this._receivePromiseMap.get(message.type);

        if(!receiveCallbacks) {
            return;
        }

        for(const callback of receiveCallbacks) {
            callback(messageInstance);
        }

        this._receivePromiseMap.set(message.type, []);
    }

    private handleResponseMessageReceived(message: IThreadMessage<ThreadMessageResponsePayload<any>>): void {
        const responseCallbacks = this._responsePromiseMap.get(message.payload.responseToId);

        if(!responseCallbacks) {
            return;
        }

        for(const callback of responseCallbacks) {
            callback(new IncomingThreadMessage(message.id, message.type, message.payload, this));
        }

        this._responsePromiseMap.set(message.payload.responseToId, []);
    }

    onMessageReceived<T>(callback: (message: IncomingThreadMessage<T, string>) => any): void {
        this._eventEmitter.on("message", callback);
    }

    removeOnMessageReceived<T>(callback: (message: IncomingThreadMessage<T, string>) => any): void {
        this._eventEmitter.removeListener("message", callback);
    }

    private fireOnMessageReceived(message: IncomingThreadMessage<any, any>): void {
        this._eventEmitter.emit("message", message);
    }
}
