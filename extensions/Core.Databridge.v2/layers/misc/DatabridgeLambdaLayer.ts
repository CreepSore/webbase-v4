import IDatabridge from "../../IDatabridge";
import IDatabridgeLayer from "../IDatabridgeLayer";

type DatabridgeLambdaLayerOptions<TInIn, TInOut, TOutIn, TOutOut> = {
    processInbound?: DatabridgeLambdaLayer<TInIn, TInOut, TOutIn, TOutOut>["processInbound"];
    processOutbound?: DatabridgeLambdaLayer<TInIn, TInOut, TOutIn, TOutOut>["processOutbound"];
    start?: DatabridgeLambdaLayer<TInIn, TInOut, TOutIn, TOutOut>["start"];
    stop?: DatabridgeLambdaLayer<TInIn, TInOut, TOutIn, TOutOut>["stop"];
}

export default class DatabridgeLambdaLayer<TInIn, TInOut, TOutIn = TInOut, TOutOut = TInIn> implements IDatabridgeLayer<TInIn, TInOut, TOutIn, TOutOut, any> {
    constructor(options: DatabridgeLambdaLayerOptions<TInIn, TInOut, TOutIn, TOutOut>) {
        this.processInbound = options.processInbound;
        this.processOutbound = options.processOutbound;
        this.start = options.start;
        this.stop = options.stop;
    }

    processInbound(data: TInIn, metadata: any): Promise<TInOut> {
        return Promise.resolve(null);
    }

    processOutbound(data: TOutIn, metadata: any): Promise<TOutOut> {
        return Promise.resolve(null);
    }

    start(databridge: IDatabridge): Promise<void> {
        return Promise.resolve();
    }

    stop(databridge: IDatabridge): Promise<void> {
        return Promise.resolve();
    }
}
