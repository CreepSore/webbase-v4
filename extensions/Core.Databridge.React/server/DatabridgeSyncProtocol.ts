import {EventEmitter} from "events";

import * as uuid from "uuid";

import DatabridgeMixedProtocol, {
    ClientConnectedEventArgs,
    ClientDisconnectedEventArgs,
    PacketReceivedEventArgs,
    MixedClient
} from "@extensions/Core.Databridge/protocols/server/DatabridgeMixedProtocol";
import IDatabridgeSocket from "@extensions/Core.Databridge/protocols/IDatabridgeSocket";
import DatabridgePacket from "@extensions/Core.Databridge/DatabridgePacket";

type SyncClient = MixedClient & {
    channelId?: string;
};

interface IDatabridgeSyncChannel {
    id: string;
    values: { [key: string]: any };
}

interface StateUpdateCallbackArgs {
    triggerClient?: SyncClient;
    channel: IDatabridgeSyncChannel;
    channelClients: SyncClient[];
    changedState: { key: string, value: any };
}

export default class DatabridgeSyncProtocol extends DatabridgeMixedProtocol {
    protected channels: IDatabridgeSyncChannel[] = [];
    protected clients: SyncClient[] = [];

    constructor() {
        super();
    }

    async start(): Promise<void> {
        await super.start();

        this.onClientConnected(args => this.handleSyncClientConnected(args));
        this.onClientDisconnected(args => this.handleSyncClientDisconnected(args));
        this.onPacketReceived(args => this.handleSyncPacketReceived(args));
    }

    async stop(): Promise<void> {
        await super.stop();
    }

    //#region Events -- START
    onStateUpdate(callback: (args: StateUpdateCallbackArgs) => void): void {
        this.emitter.on("state-update", callback);
    }

    private handleSyncClientConnected(args: ClientConnectedEventArgs): void {
        const {client} = args;
        this.clients.push(client);
    }

    private handleSyncClientDisconnected(args: ClientDisconnectedEventArgs): void {
        const {client} = args;
        this.clients = this.clients.filter(c => c.id !== client.id);
    }

    private handleSyncPacketReceived(args: PacketReceivedEventArgs<any, any>): void {
        const {packet} = args;
        switch(packet.type) {
            case "SYNC.STATE.UPDATE": return this.handleStateUpdatePacket(args);
            case "SYNC.CHANNEL.JOIN": return this.handleChannelJoinPacket(args);
            default: return;
        }
    }

    private handleStateUpdatePacket(args: PacketReceivedEventArgs<{key: string, value: string}, any>): void {
        const syncClient = this.resolveSyncClient(args.client);

        this.getChannelClients(syncClient.channelId)
            .forEach(client => this.sendStateUpdateToClient(client, args.packet.data.key, args.packet.data.value));
    }

    private handleChannelJoinPacket(args: PacketReceivedEventArgs<{channelId: string}, any>): void {
        const {client, packet} = args;
        const syncClient = this.resolveSyncClient(client);
        let channel = this.getChannel(packet.data.channelId);
        const channelExists = Boolean(channel);

        if(!channelExists) {
            channel = {
                id: packet.data.channelId,
                values: {}
            };
            this.channels.push(channel);
        }

        syncClient.channelId = packet.data.channelId;
        this.sendFullStateToClient(syncClient);
    }

    private fireStateUpdateCallback(props: StateUpdateCallbackArgs): void {
        this.emitter.emit("state-update", props);
    }
    //#region Events -- END

    protected getChannel(channelId: string): IDatabridgeSyncChannel {
        return this.channels.find(ch => ch.id === channelId);
    }

    protected getChannelClients(channelId: string): SyncClient[] {
        return this.clients.filter(c => c.channelId === channelId);
    }

    protected resolveSyncClient(client: MixedClient): SyncClient {
        return client as SyncClient;
    }

    protected sendFullStateToClient(client: SyncClient): void {
        const channel = this.getChannel(client.channelId);
        client.socket.sendPacket(new DatabridgePacket("SYNC.STATE.FULL", channel.values, {}));
    }

    protected sendStateUpdateToClient(
        client: SyncClient,
        key: string,
        value: any
    ): void {
        client.socket.sendPacket(new DatabridgePacket("SYNC.STATE.UPDATE", {key, value}, {}));
    }
}