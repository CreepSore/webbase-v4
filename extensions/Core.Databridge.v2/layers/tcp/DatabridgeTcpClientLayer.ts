import * as net from "net";
import * as events from "events";

import IDatabridge from "../../IDatabridge";
import IDatabridgeLayer, { DatabridgeDefaultPipelineMetadata } from "../IDatabridgeLayer";

export type DatabridgeTcpClientLayerOptions = {
    hostname: string;
    port: number;
};

export default class DatabridgeTcpClientLayer implements IDatabridgeLayer<Buffer, Buffer> {
    private _options: DatabridgeTcpClientLayerOptions;
    private _socket: net.Socket;
    private _connectingPromise: Promise<void>;
    private _isConnected: boolean;
    private _emitter: events.EventEmitter = new events.EventEmitter();

    get isConnected() {
        return this._isConnected;
    }

    constructor(options: DatabridgeTcpClientLayerOptions) {
        this._options = options;
    }

    processInbound(data: Buffer, metadata: DatabridgeDefaultPipelineMetadata): Promise<Buffer> {
        return Promise.resolve(data);
    }

    processOutbound(data: Buffer, metadata: DatabridgeDefaultPipelineMetadata): Promise<Buffer> {
        return new Promise<Buffer>(res => {
            this._socket.write(data, () => res(data));
        });
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
                this._connectingPromise = null;
                this._emitter.emit("connected", {socket: this._socket});
                res();
            });

            this._socket.once("close", () => {
                this._isConnected = false;
                this._emitter.emit("disconnected", {socket: this._socket});
                this.connectSocket(databridge);
            });

            this._socket.on("error", (err) => {
                this._connectingPromise = null;
                databridge.handleError(err);
            });

            this._socket.on("data", data => {
                databridge.handleInboundPacket(data);
            });
        });
    }

    on(eventName: "connected", listener: (args: {socket: net.Socket}) => void | Promise<void>): this;
    on(eventName: "disconnected", listener: (args: {socket: net.Socket}) => void | Promise<void>): this;
    on(eventName: string, listener: (args: any) => void | Promise<void>): this {
        this._emitter.on(eventName, listener);
        return this;
    }
}
