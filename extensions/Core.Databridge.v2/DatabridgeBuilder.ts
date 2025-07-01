import Databridge from "./Databridge";
import IDatabridge from "./IDatabridge";
import IDatabridgeInboundLayer from "./layers/IDatabridgeInboundLayer";
import IDatabridgeLayer, { DatabridgeDefaultPipelineMetadata } from "./layers/IDatabridgeLayer";
import IDatabridgeOutboundLayer from "./layers/IDatabridgeOutboundLayer";

export default class DatabridgeBuilder<TInIn = any, TInOut = any, TOutIn = any, TOutOut = any, TMetadata extends DatabridgeDefaultPipelineMetadata = DatabridgeDefaultPipelineMetadata> {
    private _inboundLayer: IDatabridgeLayer<any, any>;
    private _outboundLayer: IDatabridgeLayer<any, any>;

    setInboundLayer<TNInIn, TNInOut, TNMetadata>(layer: IDatabridgeInboundLayer<TNInIn, TNInOut, TNMetadata & TMetadata>): DatabridgeBuilder<TNInIn, TNInOut, TOutIn, TOutOut, TMetadata & TNMetadata> {
        this._inboundLayer = layer;
        return this as unknown as DatabridgeBuilder<TNInIn, TNInOut, TOutIn, TOutOut, TMetadata & TNMetadata>;
    }

    setOutboundLayer<TNOutIn, TNOutOut, TNMetadata>(layer: IDatabridgeOutboundLayer<TNOutIn, TNOutOut, TMetadata & TNMetadata>): DatabridgeBuilder<TInIn, TInOut, TNOutIn, TNOutOut, TMetadata & TNMetadata> {
        this._outboundLayer = layer;
        return this as unknown as DatabridgeBuilder<TInIn, TInOut, TNOutIn, TNOutOut, TMetadata & TNMetadata>;
    }

    finish(): IDatabridge<TInIn, TInOut, TOutIn, TOutOut, TMetadata> {
        return new Databridge<TInIn, TInOut, TOutIn, TOutOut, TMetadata>(this._inboundLayer, this._outboundLayer);
    }
}
