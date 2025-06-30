import * as net from "net";

import IDatabridge from "../IDatabridge";
import IDatabridgeLayer, { DatabridgeDefaultPipelineMetadata } from "./IDatabridgeLayer";

export type DatabridgeTcpClientLayerOptions = {
    hostname: string;
    port: number;
};

export default class DatabridgeTcpClientLayer implements IDatabridgeLayer<Buffer, Buffer> {
    private _socket: net.Socket;
    private _connectingPromise: Promise<void>;
    private _isConnected: boolean;
    private _options: DatabridgeTcpClientLayerOptions;

    constructor(options: DatabridgeTcpClientLayerOptions) {
        this._options = options;
    }

    process(data: Buffer, metadata: DatabridgeDefaultPipelineMetadata): Promise<Buffer> {
        if(metadata.direction === "inbound") {
            return Promise.resolve(data);
        }
        
        this._socket.write(data);
    }

    start?(databridge: IDatabridge): Promise<void> {
        return this.connectSocket(databridge);
    }

    stop?(databridge: IDatabridge): Promise<void> {
        if(this._socket) {
            this._socket.removeAllListeners();
            this._socket.destroy();
            this._socket = null;
        }

        return Promise.resolve();
    }

    private connectSocket(databridge: IDatabridge): Promise<void> {
        if(this._connectingPromise) {
            return this._connectingPromise;
        }

        return this._connectingPromise = new Promise(res => {
            if(this._socket) {
                this._socket.removeAllListeners();
            }

            this._socket = new net.Socket();
            this._socket.connect(this._options.port, this._options.hostname);

            this._socket.once("connect", () => {
                this._isConnected = true;
                res();
            });

            this._socket.once("close", () => {
                this._isConnected = false;
                this.connectSocket(databridge);
            });

            this._socket.on("error", () => {});

            this._socket.on("data", data => {
                databridge.handleInboundPacket(data);
            });
        });
    }
}
