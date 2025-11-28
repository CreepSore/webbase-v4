import IDatabridge from "../../IDatabridge";
import IDatabridgeLayer from "../IDatabridgeLayer";

export default class DatabridgeLocalInboundLayer<T> implements IDatabridgeLayer<T, T, T, T> {
    private _databridge: IDatabridge;

    async receivePacket(packet: T): Promise<void> {
        await this._databridge.handleInboundPacket(packet);
    }

    processInbound(data: T): Promise<T> {
        return Promise.resolve(data);
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
