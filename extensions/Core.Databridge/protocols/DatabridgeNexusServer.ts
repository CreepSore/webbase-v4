import * as uuid from "uuid";

import IDatabridgeServerProtocol from "./IDatabridgeServerProtocol";
import IDatabridgePacket from "../IDatabridgePacket";
import DatabridgePacket from "../DatabridgePacket";
import IDatabridgeSocket from "./IDatabridgeSocket";

class NexusChannel {
    name: string;
    secret: string | null;
    clients: IDatabridgeSocket[] = [];

    subscribeClient(client: IDatabridgeSocket): void {
        this.clients.push(client);
    }

    unsubscribeClient(client: IDatabridgeSocket): void {
        this.clients = this.clients.filter(c => c !== client);
    }

    broadcast(packet: IDatabridgePacket<any, any>, filterFunc: ((client: IDatabridgeSocket) => boolean) | null = null): void {
        this.clients.filter(filterFunc || (() => true)).forEach(client => {
            client.sendPacket(packet);
        });
    }
}

export default class DatabridgeNexusServer {
    protocols: IDatabridgeServerProtocol[];
    channels: NexusChannel[];

    constructor() {
        this.protocols = [];
        this.channels = [];
    }

    async start(): Promise<void> {
        await Promise.all(this.protocols.map(async protocol => {
            protocol.onClientConnected(client => {
                this.onClientConnected(client);
            });

            protocol.onClientDisconnected(client => {
                this.onClientDisconnected(client);
            });

            await protocol.start();
        }));
    }

    async stop(): Promise<void> {
        await Promise.all(this.protocols.map(async protocol => {
            await protocol.stop();
        }));
    }

    addProtocol(protocol: IDatabridgeServerProtocol): this {
        this.protocols.push(protocol);
        return this;
    }

    onClientConnected(client: IDatabridgeSocket): void {
        const clientId = uuid.v4();
        console.log("INFO", "NexusServer", `Client with id ${clientId} connected.`);

        client.sendPacket(new DatabridgePacket("HANDSHAKE", {
            clientId,
        }, {}));

        client.onPacketReceived(packet => {
            if(packet.type === "SUBSCRIBE") {
                const subPacket = packet as IDatabridgePacket<{channelName: string, secret?: string}>;
                const {channelName, secret} = subPacket.data;
                let channel = this.channels.find(ch => ch.name === channelName);
                if(!channel) {
                    channel = new NexusChannel();
                    channel.name = channelName;
                    channel.secret = secret || null;
                    this.channels.push(channel);
                }

                if((!channel.secret || channel.secret === secret) && !channel.clients.includes(client)) {
                    console.log("INFO", "NexusServer", `Client ${clientId} subscribed to ${channelName}.`);
                    channel.subscribeClient(client);
                    channel.broadcast(new DatabridgePacket("JOINED", {clientId, channel: channel.name}, {}));
                }
            }
            else if(packet.type === "UNSUBSCRIBE") {
                const unsubPacket = packet as IDatabridgePacket<{channelName: string}>;
                const channel = this.channels.find(ch => ch.name === unsubPacket.data.channelName);
                if(!channel || !channel.clients.includes(client)) return;

                channel.broadcast(new DatabridgePacket("LEAVED", {clientId, channel: channel.name}, {}));
                channel.unsubscribeClient(client);
                console.log("INFO", "NexusServer", `Client ${clientId} unsubscribed from ${unsubPacket.data.channelName}.`);
            }
            else if(packet.type === "BROADCAST") {
                const bcPacket = packet as IDatabridgePacket<{channelName: string, clientId: string}>;
                const channel = this.channels.find(ch => ch.name === bcPacket.data.channelName);
                if(!channel || !channel.clients.includes(client)) return;
                bcPacket.data.clientId = clientId;

                channel.broadcast(bcPacket, c => c !== client);
                console.log("INFO", "NexusServer", `Client ${clientId} broadcasted to ${channel.clients.length - 1} clients.`);
            }
        });
    }

    onClientDisconnected(client: IDatabridgeSocket): void {
        this.channels.forEach(channel => {
            channel.unsubscribeClient(client);
        });
    }
}
