import * as net from "net";
import * as events from "events";

import * as uuid from "uuid";

import IDatabridge from "../../IDatabridge";
import IDatabridgeLayer, { DatabridgeDefaultPipelineMetadata } from "../IDatabridgeLayer";

export type DatabridgeTcpServerLayerOptions = {
    bindAddress?: string;
    port: number;
};

export type DatabridgeTcpServerLayerMetadata = {
    socket: net.Socket;
    id: string;
};

export default class DatabridgeTcpServerLayer implements IDatabridgeLayer<Buffer, Buffer, Buffer, Buffer, DatabridgeDefaultPipelineMetadata & DatabridgeTcpServerLayerMetadata> {
    private _options: DatabridgeTcpServerLayerOptions;
    private _server: net.Server;
    private _clients: Set<net.Socket> = new Set();
    private _idClientMapping: Map<string, net.Socket> = new Map();
    private _emitter: events.EventEmitter = new events.EventEmitter();

    constructor(options: DatabridgeTcpServerLayerOptions) {
        this._options = options;
    }

    async processOutbound(data: Buffer<ArrayBufferLike>, metadata: DatabridgeDefaultPipelineMetadata & DatabridgeTcpServerLayerMetadata): Promise<Buffer<ArrayBufferLike>> {
        if(metadata.socket) {
            await this.sendToSocket(metadata.socket, data);
            return data;
        }

        if(metadata.id) {
            const socket = this._idClientMapping.get(metadata.id);
            if(!socket) {
                await this.sendToSocket(metadata.socket, data);
            }

            return data;
        }

        const toAwait: Promise<any>[] = [];
        const iterator = this._clients.values();
        let current: IteratorResult<net.Socket>;

        while(!(current = iterator.next()).done) {
            toAwait.push(this.sendToSocket(current.value, data));
        }

        if(toAwait.length > 0) {
            await Promise.all(toAwait);
        }

        return data;
    }

    start?(databridge: IDatabridge): Promise<void> {
        if(!this._server) {
            this._server = new net.Server(s => this.handleClientConnect(s, databridge));
            this._server.listen(this._options.port, this._options.bindAddress);
        }

        return Promise.resolve();
    }

    stop?(databridge: IDatabridge): Promise<void> {
        this._emitter.removeAllListeners();

        if(this._server) {
            this._server.close();

            for(const client of this._clients) {
                client.destroy();
            }

            this._server = null;
        }

        return Promise.resolve();
    }

    on(eventName: "client-connected", listener: (args: DatabridgeTcpServerLayerMetadata) => void | Promise<void>): this;
    on(eventName: "client-disconnected", listener: (args: DatabridgeTcpServerLayerMetadata) => void | Promise<void>): this;
    on(eventName: string, listener: (args: any) => void | Promise<void>): this {
        this._emitter.on(eventName, listener);
        return this;
    }

    private async handleClientConnect(socket: net.Socket, databridge: IDatabridge): Promise<void> {
        const id = uuid.v4();
        this._clients.add(socket);
        this._idClientMapping.set(id, socket);

        this._emitter.emit("client-connected", {socket, id});

        socket.once("close", () => {
            this._emitter.emit("client-disconnected", {socket, id});
            this._clients.delete(socket);
            this._idClientMapping.delete(id);
        });

        socket.on("data", data => {
            databridge.handleInboundPacket(data, {id, socket});
        });
    }

    private sendToSocket(socket: net.Socket, data: Buffer): Promise<void> {
        return new Promise<void>(res => {
            socket.write(data, () => res());
        });
    }
}
