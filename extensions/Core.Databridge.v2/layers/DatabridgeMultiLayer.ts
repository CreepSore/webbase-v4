import IDatabridge from "../IDatabridge";
import IDatabridgeLayer, { DatabridgeDefaultPipelineMetadata } from "./IDatabridgeLayer";

type IfAny<T, Y, N> = 0 extends (1 & T) ? Y : N;

export default class DatabridgeMultiLayer<TIn, TOut, TMetadata = DatabridgeDefaultPipelineMetadata> implements IDatabridgeLayer<TIn, TOut, TMetadata> {
    private _layers: IDatabridgeLayer<any, any, any>[] = [];
    private _databridge: IDatabridge;

    get layers(): Readonly<DatabridgeMultiLayer<any, any, DatabridgeDefaultPipelineMetadata>["_layers"]> {
        return this._layers;
    }

    async start(databridge: IDatabridge): Promise<void> {
        this._databridge = databridge;

        for(const layer of this._layers) {
            await layer.start?.(databridge);
        }
    }

    async stop(databridge: IDatabridge): Promise<void> {
        for(const layer of this._layers) {
            await layer.stop?.(databridge);
        }
    }

    async process(data: TIn, metadata: TMetadata): Promise<TOut> {
        let result = data;

        for(const layer of this._layers) {
            result = await layer.process(result, metadata);

            if(!result) {
                break;
            }
        }

        return result as unknown as TOut;
    }

    attachLayer<TNextOut, TNextMetadata>(layer: IDatabridgeLayer<TOut, TNextOut, TNextMetadata>): DatabridgeMultiLayer<TIn, TNextOut, TMetadata & TNextMetadata> {
        this._layers.push(layer);
        return this as unknown as DatabridgeMultiLayer<TIn, TNextOut, TMetadata & TNextMetadata>;
    }
}
