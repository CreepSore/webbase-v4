import IThreadIO from "../../../../src/logic/threads/io/IThreadIO";
import IncomingThreadMessage from "../../../../src/logic/threads/messages/IncomingThreadMessage";
import OutgoingThreadMessage from "../../../../src/logic/threads/messages/OutgoingThreadMessage";
import IDatabridge from "../../IDatabridge";
import IDatabridgeLayer, { DatabridgeDefaultPipelineMetadata } from "../IDatabridgeLayer";

export default class DatabridgeThreadIOLayer implements IDatabridgeLayer<any, IncomingThreadMessage<any>, OutgoingThreadMessage<any>, OutgoingThreadMessage<any>> {
    private _io: IThreadIO;
    private _databridge: IDatabridge<any, IncomingThreadMessage<any>, OutgoingThreadMessage<any>, OutgoingThreadMessage<any>>;
    private _onMessageReceived: (message: IncomingThreadMessage<any>) => void;

    constructor(io: IThreadIO) {
        this._io = io;
    }

    start(databridge: IDatabridge<any, IncomingThreadMessage<any>, OutgoingThreadMessage<any>, OutgoingThreadMessage<any>, DatabridgeDefaultPipelineMetadata>): Promise<void> {
        this._databridge = databridge;

        this._onMessageReceived = (message: IncomingThreadMessage<any>) => {
            this._databridge.handleInboundPacket(message);
        };

        this._io.onMessageReceived(this._onMessageReceived);

        return Promise.resolve();
    }

    stop(databridge: IDatabridge<any, any, any, any, DatabridgeDefaultPipelineMetadata>): Promise<void> {
        this._io.removeOnMessageReceived(this._onMessageReceived);
        return Promise.resolve();
    }

    processInbound(data: any, metadata: DatabridgeDefaultPipelineMetadata): Promise<IncomingThreadMessage<any, string>> {
        if(!data.id || !data.type || !data.payload) {
            return null;
        }

        return Promise.resolve(new IncomingThreadMessage(data.id, data.type, data.payload, this._io));
    }

    processOutbound(data: OutgoingThreadMessage<any, string>, metadata: DatabridgeDefaultPipelineMetadata): Promise<OutgoingThreadMessage<any, string>> {
        data.send();
        return Promise.resolve(data);
    }
}
