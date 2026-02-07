import IDatabridgeInboundLayer from "./IDatabridgeInboundLayer";
import IDatabridgeOutboundLayer from "./IDatabridgeOutboundLayer";

export type DatabridgeDefaultPipelineMetadata = {
    direction: "inbound" | "outbound";
};

export default interface IDatabridgeLayer<TInIn, TInOut, TOutIn = TInOut, TOutOut = TInIn, TMetadata extends DatabridgeDefaultPipelineMetadata = DatabridgeDefaultPipelineMetadata>
extends
    IDatabridgeInboundLayer<TInIn, TInOut, TMetadata>,
    IDatabridgeOutboundLayer<TOutIn, TOutOut, TMetadata>
{ }
