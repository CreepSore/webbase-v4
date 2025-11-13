import IDatabridge from "../../IDatabridge";
import IDatabridgeLayer, { DatabridgeDefaultPipelineMetadata } from "../IDatabridgeLayer";
import IDatabridgeConnectionManager from "./IDatabridgeConnectionManager";
import IDatabridgeSocket from "./IDatabridgeSocket";

export type DatabridgeGenericSocketLayerMetadata<TData, TSocket extends IDatabridgeSocket<TData>> = {
    socket: TSocket;
}

export default class DatabridgeGenericSocketLayer<TData, TSocket extends IDatabridgeSocket<TData>>
implements IDatabridgeLayer<TData, TData, TData, TData, DatabridgeDefaultPipelineMetadata & DatabridgeGenericSocketLayerMetadata<TData, TSocket>> {
    private _isStarted: boolean;
    private _connectionManager: IDatabridgeConnectionManager<TData, TSocket>;
    private _databridge: IDatabridge<any, any, any, any, DatabridgeDefaultPipelineMetadata & DatabridgeGenericSocketLayerMetadata<TData, TSocket>>;

    constructor(connectionManager: IDatabridgeConnectionManager<TData, TSocket>) {
        this._connectionManager = connectionManager;
    }

    async start(databridge: IDatabridge): Promise<void> {
        if(this._isStarted) {
            return;
        }
        this._isStarted = true;

        this._databridge = databridge;
        await this._connectionManager.start();
        this._connectionManager.onConnectionEstablished(this._onConnectionEstablished.bind(this));
    }

    async stop(databridge: IDatabridge): Promise<void> {
        if(!this._isStarted) {
            return;
        }

        this._isStarted = false;

        await this._connectionManager.stop();
    }

    async processOutbound(data: TData, metadata: DatabridgeDefaultPipelineMetadata & DatabridgeGenericSocketLayerMetadata<TData, TSocket>): Promise<TData> {
        await metadata.socket.sendData(data);
        return data;
    }

    private async _onConnectionEstablished(socket: TSocket): Promise<void> {
        socket.onDataReceived(data => {
            this._databridge.handleInboundPacket(data, {
                socket,
                direction: "inbound",
            });
        });
    }
}
