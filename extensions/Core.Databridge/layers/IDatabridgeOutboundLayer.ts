import IDatabridgeStartable from "../IDatabridgeStartable";
import { DatabridgeDefaultPipelineMetadata } from "./IDatabridgeLayer";

export default interface IDatabridgeOutboundLayer<TIn, TOut, TMetadata = DatabridgeDefaultPipelineMetadata> extends IDatabridgeStartable {
    processOutbound?(data: TIn, metadata: TMetadata): Promise<TOut>;
}
