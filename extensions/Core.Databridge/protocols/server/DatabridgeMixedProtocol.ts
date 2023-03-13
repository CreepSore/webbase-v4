import IDatabridgePacket from "@extensions/Core.Databridge/IDatabridgePacket";
import {EventEmitter} from "events";

import * as uuid from "uuid";

import IDatabridgeServerProtocol from "../IDatabridgeServerProtocol";
import IDatabridgeSocket from "../IDatabridgeSocket";

export interface RegisteredProtocol {
    name: string,
    protocol: IDatabridgeServerProtocol
}

export interface MixedClient {
    id: string,
    protocol: RegisteredProtocol,
    socket: IDatabridgeSocket
}

export interface ClientConnectedEventArgs {
    client: MixedClient
}

export interface ClientDisconnectedEventArgs {
    client: MixedClient
}

export interface PacketReceivedEventArgs<T, T2> {
    client: MixedClient,
    packet: IDatabridgePacket<T, T2>
}

export default class DatabridgeMixedProtocol {
    protected protocols: RegisteredProtocol[] = [];
    protected clients: MixedClient[] = [];
    protected emitter = new EventEmitter();

    // #region Implementations -- START
    async start(): Promise<void> {
        await Promise.all(this.protocols.map(proto => proto.protocol.start()));

        this.protocols.forEach(proto => {
            proto.protocol.onClientConnected(client => {
                const mixedClient = {
                    id: uuid.v4(),
                    protocol: proto,
                    socket: client,
                };
                this.handleClientConnected({
                    client: mixedClient,
                });

                client.onPacketReceived(packet => {
                    this.handlePacketReceived({
                        client: mixedClient,
                        packet,
                    });
                });
            }).onClientDisconnected(client => {
                this.handleClientDisconnected({client: this.resolveClient(client)});
            });
        });
    }

    async stop(): Promise<void> {
        await Promise.all(this.protocols.map(proto => proto.protocol.stop()));
    }
    // #endregion Implementations -- END

    // #region MIXED PROTOCOL -- START
    addProtocol(name: string, protocol: IDatabridgeServerProtocol): this {
        this.protocols.push({
            name,
            protocol,
        });
        return this;
    }

    removeProtocol(name: string): this {
        this.protocols = this.protocols.filter(p => p.name !== name);
        return this;
    }

    getProtocols(): RegisteredProtocol[] {
        return [...this.protocols];
    }

    resolveClient(socket: IDatabridgeSocket): MixedClient {
        return this.clients.find(client => client.socket === socket);
    }
    // #endregion MIXED PROTOCOL -- END

    // #region EVENTS -- START
    onClientConnected(callback: (args: ClientConnectedEventArgs) => void): this {
        this.emitter.on("client-connected", callback);
        return this;
    }

    onClientDisconnected(callback: (args: ClientDisconnectedEventArgs) => void): this {
        this.emitter.on("client-disconnected", callback);
        return this;
    }

    onPacketReceived(callback: (args: PacketReceivedEventArgs<any, any>) => void): this {
        this.emitter.on("packet-received", callback);
        return this;
    }

    private handleClientConnected(args: ClientConnectedEventArgs): void {
        this.fireClientConnected(args);
    }

    private handleClientDisconnected(args: ClientDisconnectedEventArgs): void {
        this.fireClientDisconnected(args);
    }

    private handlePacketReceived(args: PacketReceivedEventArgs<any, any>): void {
        this.firePacketReceived(args);
    }

    private fireClientConnected(args: ClientConnectedEventArgs): void {
        this.emitter.emit("client-connected", args);
    }

    private fireClientDisconnected(args: ClientDisconnectedEventArgs): void {
        this.emitter.emit("client-disconnected", args);
    }

    private firePacketReceived(args: PacketReceivedEventArgs<any, any>): void {
        this.emitter.emit("packet-received", args);
    }
    // #endregion EVENTS -- END
}

