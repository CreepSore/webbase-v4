import IDatabridge from "../../IDatabridge";
import IDatabridgeLayer, { DatabridgeDefaultPipelineMetadata } from "../IDatabridgeLayer";


export default class DatabridgeJsonLayer<TIn extends string | any, TOut extends (TIn extends string ? any : string)> implements IDatabridgeLayer<TIn, TOut> {
    private mode: "serialize"|"deserialize";
    private defaultValue: any;
    private databridge: IDatabridge;

    constructor(mode: "serialize"|"deserialize" = "serialize", defaultValue: any = undefined) {
        this.mode = mode;
        this.defaultValue = defaultValue;
    }

    private async process(data: TIn): Promise<TOut> {
        return this.mode === "serialize"
            ? this.processSerialize(data)
            : this.processDeserialize(data);
    }

    processInbound(data: TIn, metadata: DatabridgeDefaultPipelineMetadata): Promise<TOut> {
        return this.process(data);
    }

    processOutbound(data: TOut, metadata: DatabridgeDefaultPipelineMetadata): Promise<TIn> {
        return this.process(data);
    }

    start(databridge: IDatabridge): Promise<void> {
        this.databridge = databridge;
        return Promise.resolve();
    }

    private processSerialize(data: TIn): Promise<TOut> {
        try {
            return Promise.resolve(JSON.stringify(data)) as Promise<TOut>;
        }
        catch(err) {
            if(this.defaultValue === undefined) {
                return this.databridge.handleError(err, this);
            }

            return this.defaultValue;
        }
    }

    private processDeserialize(data: TIn): Promise<TOut> {
        try {
            return Promise.resolve(JSON.parse(data as string));
        }
        catch(err) {
            if(this.defaultValue === undefined) {
                return this.databridge.handleError(err, this);
            }

            return this.defaultValue;
        }
    }
}
