import LogBuilder from "../../src/service/logger/LogBuilder";
import IDatabridge from "./IDatabridge";
import IDatabridgeLayer from "./layers/IDatabridgeLayer";

export default class Databridge<TInIn = any, TInOut = any, TOutIn = any, TOutOut = any> implements IDatabridge<TInIn, TInOut, TOutIn, TOutOut> {
    private _inboundLayer: IDatabridgeLayer<TInIn, TInOut>;
    private _outboundLayer: IDatabridgeLayer<TOutIn, TOutOut>;

    get inboundLayer(): IDatabridgeLayer<TInIn, TInOut> {
        return this._inboundLayer;
    }

    get outboundLayer(): IDatabridgeLayer<TOutIn, TOutOut> {
        return this._outboundLayer;
    }

    constructor(inboundLayer: IDatabridgeLayer<TInIn, TInOut>, outboundLayer: IDatabridgeLayer<TOutIn, TOutOut>) {
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
        await this._inboundLayer.process(packet, metadata);
    }

    async handleOutboundPacket(packet: TOutIn, metadata: any = {}): Promise<void> {
        metadata.direction = "outbound";
        await this._outboundLayer.process(packet, metadata);
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