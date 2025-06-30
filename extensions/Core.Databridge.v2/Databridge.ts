import LogBuilder from "../../src/service/logger/LogBuilder";
import IDatabridge from "./IDatabridge";
import IDatabridgeInboundLayer from "./layers/IDatabridgeInboundLayer";
import IDatabridgeLayer from "./layers/IDatabridgeLayer";
import IDatabridgeOutboundLayer from "./layers/IDatabridgeOutboundLayer";

export default class Databridge<TInIn = any, TInOut = any, TOutIn = any, TOutOut = any> implements IDatabridge<TInIn, TInOut, TOutIn, TOutOut> {
    private _inboundLayer: IDatabridgeInboundLayer<TInIn, TInOut>;
    private _outboundLayer: IDatabridgeOutboundLayer<TOutIn, TOutOut>;

    get inboundLayer(): IDatabridgeLayer<TInIn, TInOut> {
        return this._inboundLayer;
    }

    get outboundLayer(): IDatabridgeLayer<any, any, TOutIn, TOutOut> {
        return this._outboundLayer;
    }

    constructor(inboundLayer: IDatabridgeLayer<TInIn, TInOut>, outboundLayer: IDatabridgeLayer<any, any, TOutIn, TOutOut>) {
        this._inboundLayer = inboundLayer;
        this._outboundLayer = outboundLayer;
    }

    async start(): Promise<void> {
        await this._inboundLayer.start?.(this);
        await this._outboundLayer.start?.(this);
    }

    async stop(): Promise<void> {
        await this._inboundLayer.stop?.(this);
        await this._outboundLayer.stop?.(this);
    }

    async handleInboundPacket(packet: TInIn, metadata: any = {}): Promise<void> {
        metadata.direction = "inbound";
        await this._inboundLayer.processInbound?.(packet, metadata);
    }

    async handleOutboundPacket(packet: TOutIn, metadata: any = {}): Promise<void> {
        metadata.direction = "outbound";
        await this._outboundLayer.processOutbound?.(packet, metadata);
    }

    handleError(err: Error, layer?: IDatabridgeLayer<any, any>): Promise<void> {
        const log = LogBuilder
            .start()
            .level(LogBuilder.LogLevel.ERROR)
            .info("Databridge")
            .line("Error occured")
            .object("error", err);

        if(layer) {
            log.object("layer", layer);
        }

        log.done();

        throw err;
    }
}