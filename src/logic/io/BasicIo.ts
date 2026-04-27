import BasicChannelRegistrate from "./channels/BasicChannelRegistrate";
import IChannelRegistrate from "./channels/IChannelRegistrate";
import IInboundChannel from "./channels/inbound/IInboundChannel";
import IMessageDispatcher from "./dispatcher/IMessageDispatcher";
import IIO from "./IIO";
import BasicMessageFactory from "./messages/BasicMessageFactory";
import IIncomingMessage from "./messages/IIncomingMessage";
import IMessageFactory from "./messages/IMessageFactory";
import IOutgoingMessage from "./messages/IOutgoingMessage";


export default class BasicIo<TEnvelope> implements IIO<TEnvelope> {
    private _started: boolean = false;
    private _messageFactory: IMessageFactory;
    private _channelRegistrate: IChannelRegistrate;

    private _dispatchers: Array<IMessageDispatcher> = [];

    private _recievePromises: Set<(message: IIncomingMessage<TEnvelope>) => any> = new Set();
    private _messageReceivedCallbacks: Set<(message: IIncomingMessage<TEnvelope>) => any> = new Set();

    get messageFactory(): IMessageFactory {
        return this._messageFactory;
    }

    get channelRegistrate(): IChannelRegistrate {
        return this._channelRegistrate;
    }

    constructor(messageFactory: IMessageFactory | null = null, channelRegistrate: IChannelRegistrate | null = null) {
        this._messageFactory = messageFactory ?? new BasicMessageFactory();
        this._messageFactory.setIo(this);
        this._channelRegistrate = channelRegistrate ?? new BasicChannelRegistrate();
    }

    async start(): Promise<void> {
        if(this._started) {
            return;
        }

        await this._channelRegistrate.start();

        this._started = true;
    }

    async stop(): Promise<void> {
        if(!this._started) {
            return;
        }

        await this._channelRegistrate.stop();

        this._started = false;
    }

    async sendMessage(message: IOutgoingMessage<TEnvelope>): Promise<void> {
        return this.processOutgoingMessage(message);
    }

    async receiveMessage(): Promise<IIncomingMessage<TEnvelope>> {
        const promise = new Promise<IIncomingMessage<TEnvelope>>(res => {
            this._recievePromises.add(res);
        });

        return promise;
    }

    registerDispatcher(dispatcher: IMessageDispatcher): this {
        this._dispatchers.push(dispatcher);
        dispatcher.setChannelRegistrate(this._channelRegistrate);
        dispatcher.messageProcessors.registerInboundProcessor(this);
        return this;
    }

    async processIncomingMessage(message: IIncomingMessage<TEnvelope>): Promise<void> {
        for(const callback of this._messageReceivedCallbacks) {
            callback(message);
        }

        for(const callback of this._recievePromises) {
            await callback(message);
        }

        this._recievePromises.clear();
    }

    async processOutgoingMessage(message: IOutgoingMessage<TEnvelope>): Promise<void> {
        let dispatchedSuccessfully = false;
        for(const dispatcher of this._dispatchers) {
            dispatchedSuccessfully = await dispatcher.dispatchOutgoing(message);

            if(dispatchedSuccessfully) {
                return;
            }
        }
    }
}
