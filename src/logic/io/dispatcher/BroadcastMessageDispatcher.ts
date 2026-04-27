import BasicChannelRegistrate from "../channels/BasicChannelRegistrate";
import IChannelRegistrate from "../channels/IChannelRegistrate";
import BasicMessageProcessorRegistrate from "../messages/BasicMessageProcessorRegistrate";
import IIncomingMessage from "../messages/IIncomingMessage";
import IMessageProcessorRegistrate from "../messages/IMessageProcessorRegistrate";
import IOutgoingMessage from "../messages/IOutgoingMessage";
import IMessageDispatcher from "./IMessageDispatcher";

export default class BroadcastMessageDispatcher implements IMessageDispatcher {
    private _channels: IChannelRegistrate;
    private _messageProcessors: IMessageProcessorRegistrate;

    get messageProcessors(): IMessageProcessorRegistrate {
        return this._messageProcessors;
    }

    get channels(): IChannelRegistrate {
        return this._channels;
    }

    constructor(
        channels: IChannelRegistrate = new BasicChannelRegistrate(),
        messageProcessors: IMessageProcessorRegistrate = new BasicMessageProcessorRegistrate()
    ) {
        this._channels = channels;
        this._messageProcessors = messageProcessors;
    }

    setChannelRegistrate(registrate: IChannelRegistrate): this {
        for(const channels of this._channels.inboundChannels) {
            registrate.registerInboundChannel(channels);
        }

        for(const channels of this._channels.outboundChannels) {
            registrate.registerOutboundChannel(channels);
        }

        for(const channels of this._channels.duplexChannels) {
            registrate.registerDuplexChannel(channels);
        }

        this._channels = registrate;
        return this;
    }

    async dispatchIncoming(message: IIncomingMessage<any>): Promise<boolean> {
        if(!this._channels) {
            return Promise.resolve(false);
        }

        for(const processor of this._messageProcessors.inboundMessageProcessors) {
            await processor.processIncomingMessage(message);
        }

        return Promise.resolve(true);
    }

    async dispatchOutgoing(message: IOutgoingMessage<any>): Promise<boolean> {
        if(!this._channels) {
            return Promise.resolve(false);
        }

        for(const channel of this._channels.outboundChannels) {
            await channel.send(message.payload);
        }

        for(const processor of this._messageProcessors.outboundMessageProcessors) {
            await processor.processOutgoingMessage(message);
        }

        return Promise.resolve(true);
    }
}
