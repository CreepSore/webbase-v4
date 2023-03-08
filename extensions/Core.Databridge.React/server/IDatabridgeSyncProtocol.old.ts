import {EventEmitter} from "events";

import * as uuid from "uuid";

import DatabridgePacket from "@extensions/Core.Databridge/DatabridgePacket";
import IDatabridgePacket from "@extensions/Core.Databridge/IDatabridgePacket";
import IDatabridgeServerProtocol from "@extensions/Core.Databridge/protocols/IDatabridgeServerProtocol";
import IDatabridgeSocket from "@extensions/Core.Databridge/protocols/IDatabridgeSocket";

interface IDatabridgeSyncChannel {
    id: string;
    values: { [key: string]: any };
}

type DatabridgeSyncClient = IDatabridgeSocket & {
    id: string;
    channelId?: string;
}

interface StateUpdateCallbackProps {
    triggerClient?: DatabridgeSyncClient;
    channel: IDatabridgeSyncChannel;
    channelClients: DatabridgeSyncClient[];
    changedState: { key: string, value: any };
}

export default class DatabridgeSyncProtocol implements IDatabridgeServerProtocol {
    readonly baseProtocol: IDatabridgeServerProtocol;
    clients: DatabridgeSyncClient[] = [];
    channels: IDatabridgeSyncChannel[] = [];
    readonly defaultChannel: IDatabridgeSyncChannel = {
        id: "default",
        values: {}
    };
    private readonly emitter = new EventEmitter();

    constructor(baseProtocol: IDatabridgeServerProtocol) {
        this.baseProtocol = baseProtocol;
    }

    async start(): Promise<void> {
        await this.baseProtocol.start();
        this.baseProtocol.onClientConnected(client => this.handleClientConnected(client));
        this.baseProtocol.onClientDisconnected(client => this.handleClientDisconnected(client));
    }

    async stop(): Promise<void> {
        await this.baseProtocol.stop();
    }

    onClientConnected(callback: (client: IDatabridgeSocket) => void): this {
        this.baseProtocol.onClientConnected(callback);
        return this;
    }

    onClientDisconnected(callback: (client: IDatabridgeSocket) => void): this {
        this.baseProtocol.onClientDisconnected(callback);
        return this;
    }

    onStateUpdate(callback: (props: StateUpdateCallbackProps) => void): this {
        this.emitter.on("state-update", callback);
        return this;
    }

    updateState(
        channelId: string,
        key: string,
        value: any,
        suppressEvent: boolean = true
    ) {
        const channel = this.getChannel(channelId);
        const channelClients = this.getClientsOfChannel(channelId);

        channel.values[key] = value;
        channelClients.forEach(client => client.sendPacket(new DatabridgePacket("STATE.UPDATE", { key, value }, {})));

        if(suppressEvent) {
            this.fireStateUpdate({
                channel,
                channelClients,
                changedState: {key, value}
            });
        }
    }

    private handleClientConnected(client: IDatabridgeSocket) {
        const syncClient: DatabridgeSyncClient = {
            id: uuid.v4(),
            channelId: null,
            ...client
        };
        this.clients.push(syncClient);

        client.onPacketReceived(packet => this.handlePacketReceived(syncClient, packet));
    }

    private handleClientDisconnected(client: DatabridgeSyncClient) {
        this.clients = this.clients.filter(c => c.id !== client.id);
    }

    private handlePacketReceived(client: DatabridgeSyncClient, packet: IDatabridgePacket<any, any>) {
        if(packet.type === "STATE.UPDATE") {
            const stateUpdatePacket = packet as IDatabridgePacket<{ key: string, value: any }, any>;
            const channel = this.getChannel(client.channelId);
            const channelClients = this.getClientsOfChannel(client.channelId);

            channel.values[stateUpdatePacket.data.key] = stateUpdatePacket.data.value;
            channelClients.forEach(client => client.sendPacket(packet));

            this.fireStateUpdate({
                triggerClient: client,
                channel,
                channelClients,
                changedState: {...stateUpdatePacket.data}
            });
        }

        if(packet.type === "CHANNEL.JOIN") {
            const channelJoinPacket = packet as IDatabridgePacket<{ channelId: string }, any>;
            if(!this.channels.some(ch => ch.id === channelJoinPacket.data.channelId)) {
                const newChannel: IDatabridgeSyncChannel = {
                    id: channelJoinPacket.data.channelId,
                    values: {}
                };
                this.channels.push(newChannel);
            }

            client.channelId = channelJoinPacket.data.channelId;
            Object.entries(this.getChannel(client.channelId))
                .forEach(([key, value]) => client.sendPacket(new DatabridgePacket("STATE.UPDATE", { key, value }, {})));
        }
    }

    private getChannel(channelId: string) {
        return this.channels.find(ch => ch.id === channelId) || this.defaultChannel;
    }

    private getClientsOfChannel(channelId: string) {
        return this.clients.filter(client => client.channelId === channelId);
    }

    private fireStateUpdate(props: StateUpdateCallbackProps) {
        this.emitter.emit("state-update", props);
    }
}