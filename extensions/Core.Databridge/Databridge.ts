import IDatabridge from "./IDatabridge";
import IDatabridgeErrorHandler from "./errors/IDatabridgeErrorHandler";
import IDatabridgeInboundLayer from "./layers/IDatabridgeInboundLayer";
import IDatabridgeLayer, { DatabridgeDefaultPipelineMetadata } from "./layers/IDatabridgeLayer";
import IDatabridgeOutboundLayer from "./layers/IDatabridgeOutboundLayer";

export default class Databridge<TInIn = any, TInOut = any, TOutIn = any, TOutOut = any, TMetadata extends DatabridgeDefaultPipelineMetadata = DatabridgeDefaultPipelineMetadata> implements IDatabridge<TInIn, TInOut, TOutIn, TOutOut, TMetadata> {
    private _inboundLayer: IDatabridgeInboundLayer<TInIn, TInOut>;
    private _outboundLayer: IDatabridgeOutboundLayer<TOutIn, TOutOut>;
    private _errorHandler?: IDatabridgeErrorHandler<any>;

    get inboundLayer(): IDatabridgeLayer<TInIn, TInOut> {
        return this._inboundLayer;
    }

    get outboundLayer(): IDatabridgeLayer<any, any, TOutIn, TOutOut> {
        return this._outboundLayer;
    }

    constructor(
        inboundLayer: IDatabridgeLayer<TInIn, TInOut>,
        outboundLayer: IDatabridgeLayer<any, any, TOutIn, TOutOut>,
        errorHandler?: IDatabridgeErrorHandler<any>,
    ) {
        this._inboundLayer = inboundLayer;
        this._outboundLayer = outboundLayer;
        this._errorHandler = errorHandler;
    }

    async start(): Promise<void> {
        await this._inboundLayer.start?.(this);

        if(this._outboundLayer !== this._inboundLayer) {
            await this._outboundLayer.start?.(this);
        }
    }

    async stop(): Promise<void> {
        await this._inboundLayer.stop?.(this);

        if(this._outboundLayer !== this._inboundLayer) {
            await this._outboundLayer.stop?.(this);
        }
    }

    async handleInboundPacket(packet: TInIn, metadata?: TMetadata): Promise<void> {
        // @ts-ignore
        const meta = metadata || {direction: "inbound"};
        await this._inboundLayer.processInbound?.(packet, meta);
    }

    async handleOutboundPacket(packet: TOutIn, metadata?: TMetadata): Promise<void> {
        // @ts-ignore
        const meta = metadata || {direction: "outbound"};
        await this._outboundLayer.processOutbound?.(packet, meta);
    }

    async handleError(err: Error, layer: IDatabridgeLayer<any, any>): Promise<void> {
        if(!(await this._errorHandler?.handleError(err, layer))) {
            throw err;
        }
    }
}
