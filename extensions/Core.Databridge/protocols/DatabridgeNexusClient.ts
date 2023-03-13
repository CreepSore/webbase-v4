import {EventEmitter} from "events";

import IDatabridgeClientProtocol from "./IDatabridgeClientProtocol";
import IDatabridgePacket from "../IDatabridgePacket";
import DatabridgePacket from "../DatabridgePacket";

class NexusChannel {
    name: string;
    secret: string;
    protocol: IDatabridgeClientProtocol;
    emitter: EventEmitter;

    constructor(channelName: string, secret: string, protocol: IDatabridgeClientProtocol) {
        this.name = channelName;
        this.secret = secret;
        this.protocol = protocol;
        this.emitter = new EventEmitter();
    }

    async subscribe(): Promise<void> {
        this.protocol.onPacketReceived(packet => {
            if(packet.type === "BROADCAST") {
                const bcPacket = packet as IDatabridgePacket<{clientId: string, channelName: string, data: any}>;
                this.emitter.emit("broadcast", bcPacket);
            }
        });
        this.protocol.sendPacket(new DatabridgePacket("SUBSCRIBE", {channelName: this.name, secret: this.secret}, {}));
    }

    async unsubscribe(): Promise<void> {
        this.protocol.sendPacket(new DatabridgePacket("UNSUBSCRIBE", {channelName: this.name}, {}));
        this.emitter.removeAllListeners();
    }

    async broadcast<T>(packet: T): Promise<void> {
        this.protocol.sendPacket(new DatabridgePacket("BROADCAST", {channelName: this.name, ...packet}, {}));
    }

    onBroadcast<T>(callback: (packet: IDatabridgePacket<T & {clientId: string, channelName: string}>) => void): void {
        this.emitter.on("broadcast", callback);
    }
}

export default class DatabridgeNexusServer {
    protocol: IDatabridgeClientProtocol;
    clientId: string;

    constructor(protocol: IDatabridgeClientProtocol) {
        this.protocol = protocol;
    }

    async connect(): Promise<void> {
        this.protocol.onPacketReceived(packet => {
            if(packet.type === "HANDSHAKE") {
                const {clientId} = packet.data as {clientId: string};
                this.clientId = clientId;
            }
        });

        await this.protocol.connect();
    }

    async disconnect(): Promise<void> {
        await this.protocol.disconnect();
    }

    createChannel(channelName: string, secret: string, callback: (channel: NexusChannel) => void): this {
        const channel = new NexusChannel(channelName, secret, this.protocol);
        callback(channel);
        return this;
    }
}
