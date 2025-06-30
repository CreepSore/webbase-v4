import IDatabridge from "../IDatabridge";
import IDatabridgeLayer, { DatabridgeDefaultPipelineMetadata } from "./IDatabridgeLayer";

export default class DatabridgeLocalOutboundLayer<T> implements IDatabridgeLayer<T, T> {
    private _databridge: IDatabridge;
    private _onPacketSent: (packet: T) => Promise<void> | void;

    constructor(onPacketSentCallback?: DatabridgeLocalOutboundLayer<T>["_onPacketSent"]) {
        this._onPacketSent = onPacketSentCallback;
    }

    async sendPacket(packet: T): Promise<void> {
        await this._databridge.handleOutboundPacket(packet);
    }

    async process(data: T, metadata: DatabridgeDefaultPipelineMetadata): Promise<T> {
        if(metadata.direction === "outbound") {
            await this._onPacketSent?.(data);
            return data;
        }

        return data;
    }

    start?(databridge: IDatabridge): Promise<void> {
        this._databridge = databridge;
        return Promise.resolve();
    }

    stop?(databridge: IDatabridge): Promise<void> {
        this._databridge = null;
        return Promise.resolve();
    }
}
