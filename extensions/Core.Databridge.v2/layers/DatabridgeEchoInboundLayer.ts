import IDatabridge from "../IDatabridge";
import IDatabridgeLayer from "./IDatabridgeLayer";

export default class DatabridgeEchoInboundLayer implements IDatabridgeLayer<any, any> {
    private _databridge: IDatabridge;

    async process(data: any): Promise<any> {
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