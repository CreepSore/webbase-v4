import IDatabridgeStartable from "../IDatabridgeStartable";
import { DatabridgeDefaultPipelineMetadata } from "./IDatabridgeLayer";

export default interface IDatabridgeInboundLayer<TIn, TOut, TMetadata = DatabridgeDefaultPipelineMetadata> extends IDatabridgeStartable {
    processInbound?(data: TIn, metadata: TMetadata): Promise<TOut>;
}
