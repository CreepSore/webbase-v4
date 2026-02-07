import IDatabridge from "../../IDatabridge";
import IDatabridgeLayer, { DatabridgeDefaultPipelineMetadata } from "../IDatabridgeLayer";

export default class DatabridgeEchoInboundLayer implements IDatabridgeLayer<any, any, any, any> {
    private _databridge: IDatabridge;

    async processInbound(data: any, metadata: DatabridgeDefaultPipelineMetadata): Promise<any> {
        await this._databridge.handleOutboundPacket(data);
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
