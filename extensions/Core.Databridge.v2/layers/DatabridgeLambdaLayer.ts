import IDatabridge from "../IDatabridge";
import IDatabridgeLayer from "./IDatabridgeLayer";

type DatabridgeLambdaLayerOptions<TIn, TOut> = {
    process?: DatabridgeLambdaLayer<TIn, TOut>["process"];
    start?: DatabridgeLambdaLayer<any, any>["start"];
    stop?: DatabridgeLambdaLayer<any, any>["stop"];
}

export default class DatabridgeLambdaLayer<TIn, TOut> implements IDatabridgeLayer<TIn, TOut, any> {
    constructor(options: DatabridgeLambdaLayerOptions<TIn, TOut>) {
        this.process = options.process;
        this.start = options.start;
        this.stop = options.stop;
    }

    process(data: TIn, metadata: any): Promise<TOut> {
        return Promise.resolve(null);
    }

    start(databridge: IDatabridge): Promise<void> {
        return Promise.resolve();
    }

    stop(databridge: IDatabridge): Promise<void> {
        return Promise.resolve();
    }
}
