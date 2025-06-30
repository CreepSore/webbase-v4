import IDatabridgeLayer from "./layers/IDatabridgeLayer";

export default interface IDatabridge<TInIn = any, TInOut = any, TOutIn = any, TOutOut = any> {
    get inboundLayer(): IDatabridgeLayer<TInIn, TInOut>;
    get outboundLayer(): IDatabridgeLayer<TOutIn, TOutOut>;

    start(): Promise<void>;
    stop(): Promise<void>;

    handleInboundPacket(packet: TInIn): Promise<void>;
    handleInboundPacket(packet: TInIn, metadata: any): Promise<void>;
    handleOutboundPacket(packet: TOutIn): Promise<void>;
    handleOutboundPacket(packet: TOutIn, metadata: any): Promise<void>;

    handleError(err: Error, layer?: IDatabridgeLayer<any, any>): Promise<any>;
}
