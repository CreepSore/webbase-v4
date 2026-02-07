import IDatabridge from "../../IDatabridge";
import IDatabridgeInboundLayer from "../IDatabridgeInboundLayer";
import IDatabridgeLayer, { DatabridgeDefaultPipelineMetadata } from "../IDatabridgeLayer";
import IDatabridgeOutboundLayer from "../IDatabridgeOutboundLayer";

type DatabridgeChoiceLayerOptions<TInIn, TInOut, TOutIn, TOutOut, TMetadata extends DatabridgeDefaultPipelineMetadata> = {
    chooseLayerInbound?: DatabridgeChoiceLayer<TInIn, TInOut, TOutIn, TOutOut, TMetadata>["_chooseLayerInbound"],
    chooseLayerOutbound?: DatabridgeChoiceLayer<TInIn, TInOut, TOutIn, TOutOut, TMetadata>["_chooseLayerOutbound"]
};

export default class DatabridgeChoiceLayer<TInIn, TInOut, TOutIn = TInOut, TOutOut = TInIn, TMetadata extends DatabridgeDefaultPipelineMetadata = any> implements IDatabridgeLayer<TInIn, TInOut, TOutIn, TOutOut, TMetadata> {
    private _inboundLayers: Map<string, IDatabridgeInboundLayer<TInIn, TInOut>> = new Map();
    private _outboundLayers: Map<string, IDatabridgeOutboundLayer<TOutIn, TOutOut>> = new Map();
    private _chooseLayerInbound: (data: TInIn, metadata: DatabridgeDefaultPipelineMetadata) => string;
    private _chooseLayerOutbound: (data: TOutIn, metadata: DatabridgeDefaultPipelineMetadata) => string;

    constructor(
        options: DatabridgeChoiceLayerOptions<TInIn, TInOut, TOutIn, TOutOut, TMetadata> = {},
    ) {
        this._chooseLayerInbound = options.chooseLayerInbound;
        this._chooseLayerOutbound = options.chooseLayerOutbound;
    }

    processInbound(data: TInIn, metadata: TMetadata): Promise<TInOut> {
        if(!this._chooseLayerInbound) {
            return Promise.resolve(data as unknown as TInOut);
        }

        const layerKey = this._chooseLayerInbound(data, metadata);
        if(!layerKey) {
            return Promise.resolve(data as unknown as TInOut);
        }

        const layer = this._inboundLayers.get(layerKey);
        return layer.processInbound?.(data, metadata);
    }

    processOutbound(data: TOutIn, metadata: TMetadata): Promise<TOutOut> {
        if(!this._chooseLayerOutbound) {
            return Promise.resolve(data as unknown as TOutOut);
        }

        const layerKey = this._chooseLayerOutbound(data, metadata);
        if(!layerKey) {
            return Promise.resolve(data as unknown as TOutOut);
        }

        const layer = this._outboundLayers.get(layerKey);
        return layer.processOutbound?.(data, metadata);
    }

    async start(databridge: IDatabridge): Promise<void> {
        await Promise.all([...this._inboundLayers, ...this._outboundLayers].map(async([, layer]) => {
            await layer.start?.(databridge);
        }));
    }

    async stop(databridge: IDatabridge): Promise<void> {
        await Promise.all([...this._inboundLayers, ...this._outboundLayers].map(async([, layer]) => {
            await layer.stop?.(databridge);
        }));
    }

    registerLayer(key: string, layer: IDatabridgeLayer<TInIn, TInOut, TOutIn, TOutOut, TMetadata>): this {
        this._inboundLayers.set(key, layer);
        this._outboundLayers.set(key, layer);
        return this;
    }

    registerInboundLayer(key: string, layer: IDatabridgeInboundLayer<TInIn, TInOut, TMetadata>): this {
        this._inboundLayers.set(key, layer);
        return this;
    }

    registerOutboundLayer(key: string, layer: IDatabridgeInboundLayer<TInIn, TInOut, TMetadata>): this {
        this._outboundLayers.set(key, layer);
        return this;
    }
}
