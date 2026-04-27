import IDuplexChannel from "./duplex/IDuplexChannel";
import IInboundChannel from "./inbound/IInboundChannel";
import IOutboundChannel from "./outbound/IOutboundChannel";

export default interface IChannelRegistrate {
    get inboundChannels(): ReadonlySet<IInboundChannel<any>>;
    get outboundChannels(): ReadonlySet<IOutboundChannel<any>>;
    get duplexChannels(): ReadonlySet<IDuplexChannel<any>>;

    start(): Promise<void>;
    stop(): Promise<void>;

    registerInboundChannel<T>(channel: IInboundChannel<T>): Promise<void>;
    registerOutboundChannel<T>(channel: IOutboundChannel<T>): Promise<void>;
    registerDuplexChannel<T>(channel: IDuplexChannel<T>): Promise<void>;

    unregisterInboundChannel<T>(channel: IInboundChannel<T>): Promise<void>;
    unregisterOutboundChannel<T>(channel: IOutboundChannel<T>): Promise<void>;
    unregisterDuplexChannel<T>(channel: IDuplexChannel<T>): Promise<void>;
}
