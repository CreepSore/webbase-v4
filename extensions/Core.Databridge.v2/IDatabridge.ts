import IDatabridgeInboundLayer from "./layers/IDatabridgeInboundLayer";
import IDatabridgeLayer from "./layers/IDatabridgeLayer";
import IDatabridgeOutboundLayer from "./layers/IDatabridgeOutboundLayer";

export default interface IDatabridge<TInIn = any, TInOut = any, TOutIn = any, TOutOut = any> {
    get inboundLayer(): IDatabridgeInboundLayer<TInIn, TInOut>;
    get outboundLayer(): IDatabridgeOutboundLayer<TOutIn, TOutOut>;

    start(): Promise<void>;
    stop(): Promise<void>;

    handleInboundPacket(packet: TInIn): Promise<void>;
    handleInboundPacket(packet: TInIn, metadata: any): Promise<void>;
    handleOutboundPacket(packet: TOutIn): Promise<void>;
    handleOutboundPacket(packet: TOutIn, metadata: any): Promise<void>;

    handleError(err: Error, layer?: IDatabridgeLayer<any, any>): Promise<any>;
}
