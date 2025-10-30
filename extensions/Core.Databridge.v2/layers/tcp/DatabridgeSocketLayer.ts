import * as net from "net";

import IDatabridge from "../../IDatabridge";
import IDatabridgeLayer, { DatabridgeDefaultPipelineMetadata } from "../IDatabridgeLayer";

export default class DatabridgeSocketLayer implements IDatabridgeLayer<Buffer, Buffer> {
    private _socket: net.Socket;
    private _callbacks: Map<string, Function> = new Map();

    constructor(socket: net.Socket) {
        this._socket = socket;
    }

    async processOutbound(data: Buffer, metadata: DatabridgeDefaultPipelineMetadata): Promise<Buffer> {
        await new Promise<void>(res => this._socket.write(data, () => res()));
        return data;
    }

    start?(databridge: IDatabridge): Promise<void> {
        const closeCallback = () => {
            this.stop(databridge);
        };

        const dataCallback = (data: Buffer) => {
            databridge.handleInboundPacket(data);
        };

        const errorCallback = (err: Error) => {
            databridge.handleError(err, this);
        }

        this._callbacks.set("close", closeCallback);
        this._callbacks.set("data", dataCallback);
        this._callbacks.set("error", errorCallback);

        this._socket.once("close", closeCallback);
        this._socket.on("data", dataCallback);
        this._socket.on("error", errorCallback);

        return Promise.resolve();
    }

    stop?(databridge: IDatabridge): Promise<void> {
        for(const [key, fn] of [...this._callbacks]) {
            this._socket.removeListener(key, fn as any);
        }

        return Promise.resolve();
    }
}
