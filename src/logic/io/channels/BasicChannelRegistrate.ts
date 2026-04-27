import IDuplexChannel from "./duplex/IDuplexChannel";
import IChannelRegistrate from "./IChannelRegistrate";
import IInboundChannel from "./inbound/IInboundChannel";
import IOutboundChannel from "./outbound/IOutboundChannel";

export default class BasicChannelRegistrate implements IChannelRegistrate {
    private _started: boolean = false;

    private _inboundChannels: Set<IInboundChannel<any>> = new Set();
    private _outboundChannels: Set<IOutboundChannel<any>> = new Set()
    private _duplexChannels: Set<IDuplexChannel<any>> = new Set();

    get inboundChannels(): ReadonlySet<IInboundChannel<any>> {
        return this._inboundChannels;
    }

    get outboundChannels(): ReadonlySet<IOutboundChannel<any>> {
        return this._outboundChannels;
    }

    get duplexChannels(): ReadonlySet<IDuplexChannel<any>> {
        return this._duplexChannels;
    }

    async start(): Promise<void> {
        if(this._started) {
            return;
        }

        for(const channel of this._inboundChannels) {
            await channel.start();
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
        }

        for(const channel of this._outboundChannels) {
            await channel.stop();
        }

        this._started = false;
    }

    async registerInboundChannel<T>(channel: IInboundChannel<T>): Promise<void> {
        this._inboundChannels.add(channel);
    }

    async registerOutboundChannel<T>(channel: IOutboundChannel<T>): Promise<void> {
        this._outboundChannels.add(channel);
    }

    async registerDuplexChannel<T>(channel: IDuplexChannel<T>): Promise<void> {
        this._duplexChannels.add(channel);
        this._inboundChannels.add(channel);
        this._outboundChannels.add(channel);
    }

    async unregisterInboundChannel<T>(channel: IInboundChannel<T>): Promise<void> {
        this._inboundChannels.delete(channel);
    }

    async unregisterOutboundChannel<T>(channel: IOutboundChannel<T>): Promise<void> {
        this._outboundChannels.delete(channel);
    }

    async unregisterDuplexChannel<T>(channel: IDuplexChannel<T>): Promise<void> {
        this._inboundChannels.delete(channel);
        this._outboundChannels.delete(channel);
        this._duplexChannels.delete(channel);

        await channel.stop();
    }
}
