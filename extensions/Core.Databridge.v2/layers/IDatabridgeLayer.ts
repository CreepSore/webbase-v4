import IDatabridge from "../IDatabridge";

export type DatabridgeDefaultPipelineMetadata = {
    direction: "inbound" | "outbound";
};

export default interface IDatabridgeLayer<TIn, TOut, TMetadata = DatabridgeDefaultPipelineMetadata> {
    process(data: TIn, metadata: TMetadata): Promise<TOut>;
    start?(databridge: IDatabridge): Promise<void>;
    stop?(databridge: IDatabridge): Promise<void>;
}
