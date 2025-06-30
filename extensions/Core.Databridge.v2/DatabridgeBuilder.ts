import Databridge from "./Databridge";
import IDatabridge from "./IDatabridge";
import IDatabridgeLayer from "./layers/IDatabridgeLayer";

export default class DatabridgeBuilder<TInIn = any, TInOut = any, TOutIn = any, TOutOut = any> {
    private _inboundLayer: IDatabridgeLayer<any, any>;
    private _outboundLayer: IDatabridgeLayer<any, any>;

    setInboundLayer<TNInIn, TNInOut>(layer: IDatabridgeLayer<TNInIn, TNInOut>): DatabridgeBuilder<TNInIn, TNInOut, TOutIn, TOutOut> {
        this._inboundLayer = layer;
        return this as unknown as DatabridgeBuilder<TNInIn, TNInOut, TOutIn, TOutOut>;
    }

    setOutboundLayer<TNOutIn, TNOutOut>(layer: IDatabridgeLayer<TNOutIn, TNOutOut>): DatabridgeBuilder<TInIn, TInOut, TNOutIn, TNOutOut> {
        this._outboundLayer = layer;
        return this as unknown as DatabridgeBuilder<TInIn, TInOut, TNOutIn, TNOutOut>;
    }

    finish(): IDatabridge<TInOut, TOutIn> {
        return new Databridge(this._inboundLayer, this._outboundLayer);
    }
}
