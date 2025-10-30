import IDatabridge from "../../IDatabridge";
import IDatabridgeLayer, { DatabridgeDefaultPipelineMetadata } from "../IDatabridgeLayer";

type DatabridgeLambdaLayerOptions<TInIn, TInOut, TOutIn, TOutOut, TMetadata extends DatabridgeDefaultPipelineMetadata> = {
    processInbound?: DatabridgeLambdaLayer<TInIn, TInOut, TOutIn, TOutOut, TMetadata>["processInbound"];
    processOutbound?: DatabridgeLambdaLayer<TInIn, TInOut, TOutIn, TOutOut, TMetadata>["processOutbound"];
    start?: DatabridgeLambdaLayer<TInIn, TInOut, TOutIn, TOutOut, TMetadata>["start"];
    stop?: DatabridgeLambdaLayer<TInIn, TInOut, TOutIn, TOutOut, TMetadata>["stop"];
}

export default class DatabridgeLambdaLayer<TInIn, TInOut, TOutIn = TInOut, TOutOut = TInIn, TMetadata extends DatabridgeDefaultPipelineMetadata = DatabridgeDefaultPipelineMetadata> implements IDatabridgeLayer<TInIn, TInOut, TOutIn, TOutOut, TMetadata> {
    constructor(options: DatabridgeLambdaLayerOptions<TInIn, TInOut, TOutIn, TOutOut, TMetadata> = {}) {
        this.processInbound = options.processInbound;
        this.processOutbound = options.processOutbound;
        this.start = options.start;
        this.stop = options.stop;
    }

    processInbound(data: TInIn, metadata: TMetadata): Promise<TInOut> {
        return Promise.resolve(null);
    }

    processOutbound(data: TOutIn, metadata: TMetadata): Promise<TOutOut> {
        return Promise.resolve(null);
    }

    start(databridge: IDatabridge): Promise<void> {
        return Promise.resolve();
    }

    stop(databridge: IDatabridge): Promise<void> {
        return Promise.resolve();
    }
}
