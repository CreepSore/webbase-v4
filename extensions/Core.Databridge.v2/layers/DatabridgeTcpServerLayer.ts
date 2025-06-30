import * as net from "net";

import * as uuid from "uuid";

import IDatabridge from "../IDatabridge";
import IDatabridgeLayer, { DatabridgeDefaultPipelineMetadata } from "./IDatabridgeLayer";

export type DatabridgeTcpServerLayerOptions = {
    bindAddress?: string;
    port: number;
}

export default class DatabridgeTcpServerLayer implements IDatabridgeLayer<Buffer, Buffer, DatabridgeDefaultPipelineMetadata & {socket: net.Socket, id: string}> {
    private _server: net.Server;
    private _clients: Set<net.Socket> = new Set();
    private _idClientMapping: Map<string, net.Socket> = new Map();
    private _options: DatabridgeTcpServerLayerOptions;

    constructor(options: DatabridgeTcpServerLayerOptions) {
        this._options = options;
    }

    async process(data: Buffer<ArrayBufferLike>, metadata: DatabridgeDefaultPipelineMetadata & {socket: net.Socket, id: string}): Promise<Buffer<ArrayBufferLike>> {
        if(metadata.direction === "inbound") {
            return data;
        }

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
        if(this._server) {
            this._server.close();
            this._server = null;
        }

        return Promise.resolve();
    }

    private async handleClientConnect(socket: net.Socket, databridge: IDatabridge): Promise<void> {
        const id = uuid.v4();
        this._clients.add(socket);
        this._idClientMapping.set(id, socket);

        socket.once("close", () => {
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
