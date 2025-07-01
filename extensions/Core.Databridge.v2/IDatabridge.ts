import IDatabridgeInboundLayer from "./layers/IDatabridgeInboundLayer";
import IDatabridgeLayer, { DatabridgeDefaultPipelineMetadata } from "./layers/IDatabridgeLayer";
import IDatabridgeOutboundLayer from "./layers/IDatabridgeOutboundLayer";

export default interface IDatabridge<TInIn = any, TInOut = any, TOutIn = any, TOutOut = any, TMetadata extends DatabridgeDefaultPipelineMetadata = DatabridgeDefaultPipelineMetadata> {
    get inboundLayer(): IDatabridgeInboundLayer<TInIn, TInOut>;
    get outboundLayer(): IDatabridgeOutboundLayer<TOutIn, TOutOut>;

    start(): Promise<void>;
    stop(): Promise<void>;

    handleInboundPacket(packet: TInIn): Promise<void>;
    handleInboundPacket(packet: TInIn, metadata: TMetadata): Promise<void>;
    handleOutboundPacket(packet: TOutIn): Promise<void>;
    handleOutboundPacket(packet: TOutIn, metadata: TMetadata): Promise<void>;

    handleError(err: Error, layer?: IDatabridgeLayer<any, any>): Promise<any>;
}
