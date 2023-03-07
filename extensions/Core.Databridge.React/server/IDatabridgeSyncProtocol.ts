import DatabridgePacket from "@extensions/Core.Databridge/DatabridgePacket";
import IDatabridgePacket from "@extensions/Core.Databridge/IDatabridgePacket";
import IDatabridgeServerProtocol from "@extensions/Core.Databridge/protocols/IDatabridgeServerProtocol";
import IDatabridgeSocket from "@extensions/Core.Databridge/protocols/IDatabridgeSocket";

export default class DatabridgeSyncProtocol implements IDatabridgeServerProtocol {
    baseProtocol: IDatabridgeServerProtocol;
    clients: IDatabridgeSocket[] = [];
    values: { [key: string]: any } = {};

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

    private handleClientConnected(client: IDatabridgeSocket) {
        this.clients.push(client);

        client.onPacketReceived(packet => this.handlePacketReceived(client, packet));
        Object.entries(this.values)
            .forEach(([key, value]) => client.sendPacket(new DatabridgePacket("STATE.UPDATE", { key, value }, {})));
    }

    private handleClientDisconnected(client: IDatabridgeSocket) {
        this.clients = this.clients.filter(c => c !== client);
    }

    private handlePacketReceived(client: IDatabridgeSocket, packet: IDatabridgePacket<any, any>) {
        if(packet.type === "STATE.UPDATE") {
            this.clients.forEach(client => client.sendPacket(packet));
        }
    }
}