import IDatabridge from "../IDatabridge";
import IDatabridgeInboundLayer from "./IDatabridgeInboundLayer";
import IDatabridgeLayer, { DatabridgeDefaultPipelineMetadata } from "./IDatabridgeLayer";
import IDatabridgeOutboundLayer from "./IDatabridgeOutboundLayer";

export default class DatabridgeMultiLayer<TIn, TOut, TMetadata extends DatabridgeDefaultPipelineMetadata> implements IDatabridgeLayer<TIn, TOut, TIn, TOut, TMetadata> {
    private _layers: IDatabridgeLayer<any, any, any>[] = [];
    private _databridge: IDatabridge;

    get layers(): Readonly<IDatabridgeLayer<any, any, any, any>[]> {
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

    async processInbound(data: TIn, metadata: DatabridgeDefaultPipelineMetadata): Promise<TOut> {
        let result = data;

        for(const layer of this._layers) {
            if(!layer.processInbound) {
                continue;
            }

            result = await layer.processInbound(result, metadata as any);

            if(!result) {
                break;
            }
        }

        return result as unknown as TOut;
    }

    async processOutbound(data: TIn, metadata: DatabridgeDefaultPipelineMetadata): Promise<TOut> {
        let result = data;

        for(const layer of this._layers) {
            if(!layer.processOutbound) {
                continue;
            }

            result = await layer.processOutbound(result, metadata as any);

            if(!result) {
                break;
            }
        }

        return result as unknown as TOut;
    }

    attachOutboundLayer<TNewIn, TNewMetadata>(layer: IDatabridgeOutboundLayer<TIn, TNewIn, TMetadata & TNewMetadata>): DatabridgeMultiLayer<TNewIn, TOut, TMetadata & TNewMetadata> {
        this.attachLayer(layer);
        return this as unknown as DatabridgeMultiLayer<TNewIn, TOut, TMetadata & TNewMetadata>;
    }

    attachInboundLayer<TNewIn, TNewMetadata>(layer: IDatabridgeInboundLayer<TIn, TNewIn, TMetadata & TNewMetadata>): DatabridgeMultiLayer<TNewIn, TOut, TMetadata & TNewMetadata> {
        this.attachLayer(layer);
        return this as unknown as DatabridgeMultiLayer<TNewIn, TOut, TMetadata & TNewMetadata>;
    }

    private attachLayer(layer: IDatabridgeLayer<any, any, any>): void {
        this._layers.push(layer);
    }
}