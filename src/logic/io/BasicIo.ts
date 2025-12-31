import IDuplexChannel from "./channels/duplex/IDuplexChannel";
import IInboundChannel from "./channels/inbound/IInboundChannel";
import IOutboundChannel from "./channels/outbound/IOutboundChannel";
import IIO from "./IIO";
import IIncomingMessage from "./messages/IIncomingMessage";
import IMessageFactory from "./messages/IMessageFactory";
import IOutgoingMessage from "./messages/IOutgoingMessage";


export default class BasicIo implements IIO {
    private _started: boolean;
    private _messageFactory: IMessageFactory;

    private _inboundChannels: Array<IInboundChannel> = [];
    private _outboundChannels: Array<IOutboundChannel> = [];

    private _recievePromises: Set<(message: IIncomingMessage<any>) => any> = new Set();
    private _messageReceivedCallbacks: Set<(message: IIncomingMessage<Buffer>) => any> = new Set();
    private _handleMessageCallback: typeof this._handleMessageReceived = (buffer: Buffer) => this._handleMessageReceived(buffer);

    get messageFactory(): IMessageFactory {
        return this._messageFactory;
    }

    constructor(messageFactory: IMessageFactory) {
        this._messageFactory = messageFactory;
        this._messageFactory.setIo(this);
    }

    async start(): Promise<void> {
        if(this._started) {
            return;
        }

        for(const channel of this._inboundChannels) {
            await channel.start();
            this._initializeInboundChannel(channel);
        }

        for(const channel of this._outboundChannels) {
            await channel.start();
        }

        this._started = true;
    }

    async stop(): Promise<void> {
        if(!this._started) {
            return;
        }

        for(const channel of this._inboundChannels) {
            await channel.stop();
            channel.removeOnMessageReceived(this._handleMessageCallback);
        }

        for(const channel of this._outboundChannels) {
            await channel.stop();
        }

        this._started = false;
    }

    async sendMessage(message: IOutgoingMessage<Buffer>): Promise<void> {
        for(const channel of this._outboundChannels) {
            await channel.send(message.payload);
        }
    }

    async receiveMessage(): Promise<IIncomingMessage<Buffer>> {
        let callback: (message: IIncomingMessage<Buffer>) => void;

        const promise = new Promise<IIncomingMessage<Buffer>>(res => {
            callback = res;
        });

        this._recievePromises.add(callback);
        return promise;
    }

    onMessageReceived(callback: (message: IIncomingMessage<Buffer>) => any): void {
        this._messageReceivedCallbacks.add(callback);
    }

    removeOnMessageReceived(callback: (message: IIncomingMessage<Buffer>) => any): void {
        this._messageReceivedCallbacks.delete(callback);
    }

    /**
     * Channels have to be registered before the initial start() call,
     * because starting of the channels happens there.
     *
     * If there's the need to add channels after that,
     * start() has to be called for the channel by you.
     */
    registerInboundChannel(channel: IInboundChannel): this {
        this._inboundChannels.push(channel);

        if(this._started) {
            this._initializeInboundChannel(channel);
        }

        return this;
    }

    /**
     * Channels have to be registered before the initial start() call,
     * because starting of the channels happens there.
     *
     * If there's the need to add channels after that,
     * start() has to be called for the channel by you.
     */
    registerOutboundChannel(channel: IOutboundChannel): this {
        this._outboundChannels.push(channel);
        return this;
    }

    /**
     * Channels have to be registered before the initial start() call,
     * because starting of the channels happens there.
     *
     * If there's the need to add channels after that,
     * start() has to be called for the channel by you.
     */
    registerDuplexChannel(channel: IDuplexChannel): this {
        this.registerInboundChannel(channel);
        this.registerOutboundChannel(channel);
        return this;
    }

    private async _handleMessageReceived(buffer: Buffer): Promise<void> {
        const message = this._messageFactory.buildIncomingMessage(buffer);

        for(const callback of this._messageReceivedCallbacks) {
            callback(message);
        }

        for(const callback of this._recievePromises) {
            await callback(message);
        }

        this._recievePromises.clear();
    }

    private _initializeInboundChannel(channel: IInboundChannel): void {
        channel.onMessageReceived(this._handleMessageCallback);
    }
}
