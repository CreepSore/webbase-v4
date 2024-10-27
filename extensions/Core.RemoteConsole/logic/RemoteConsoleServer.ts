import * as uuid from "uuid";

import IDatabridgeSocket from "@extensions/Core.Databridge/protocols/IDatabridgeSocket";
import DatabridgeTcpServerProtocol from "@extensions/Core.Databridge/protocols/server/DatabridgeTcpServerProtocol";
import ILogEntry from "@service/logger/ILogEntry";
import LoggerService from "@service/logger/LoggerService";
import IDatabridgePacket from "@extensions/Core.Databridge/IDatabridgePacket";
import DatabridgePacket from "@extensions/Core.Databridge/DatabridgePacket";
import CommandHandler from "@app/CommandHandler";
import LogBuilder from "@service/logger/LogBuilder";

export interface RemoteConsoleServerOptions {
    host: string;
    port: number;
    secret: string;
    commandHandler: CommandHandler;
}

interface RemoteConsoleClient {
    id: string;
    socket: IDatabridgeSocket;
    registeredEvents: string[];
    connectedAt: number;
    lastKeepaliveAt: number;
    authenticated: boolean;
}

export default class RemoteConsoleServer extends DatabridgeTcpServerProtocol {
    private _options: RemoteConsoleServerOptions;
    private _clients: RemoteConsoleClient[] = [];
    private _keepaliveInterval: NodeJS.Timeout;

    get options(): typeof this._options {
        return this._options;
    }

    constructor(options: RemoteConsoleServerOptions) {
        super(options.port, options.host);
        this._options = options;
    }

    async start(): Promise<void> {
        LoggerService.addLogger({
            log: async(log: ILogEntry) => {
                this._clients
                    .filter(client => client.registeredEvents.includes("LOG"))
                    .forEach(client => client.socket.sendPacket(new DatabridgePacket("EVENT.LOG", log, {})));
            },
        }, "Core.RemoteConsole.Logger");

        await super.start();
        this.onClientConnected((client) => this.handleClientConnected(client));
        this.onClientDisconnected((client) => this.handleClientDisconnected(client));
        this.onError(() => {});

        this._keepaliveInterval = setInterval(() => this.handleKeepAliveInterval(), 1000);
    }

    async stop(): Promise<void> {
        clearInterval(this._keepaliveInterval);
        await super.stop();
    }

    private handleClientConnected(client: IDatabridgeSocket): void {
        const remoteConsoleClient: RemoteConsoleClient = {
            id: uuid.v4(),
            socket: client,
            registeredEvents: [],
            lastKeepaliveAt: Date.now(),
            connectedAt: Date.now(),
            authenticated: false,
        };

        LogBuilder
            .start()
            .level(LogBuilder.LogLevel.INFO)
            .info("Core.RemoteConsole")
            .line("Client connected")
            .object("remoteConsoleClient", remoteConsoleClient)
            .done();

        this._clients.push(remoteConsoleClient);
        client.onPacketReceived(packet => this.handleClientPacket(remoteConsoleClient, packet));
    }

    private handleClientDisconnected(client: IDatabridgeSocket): void {
        const remoteConsoleClient = this.getClientBySocket(client);
        if(!remoteConsoleClient) return;

        LogBuilder
            .start()
            .level(LogBuilder.LogLevel.INFO)
            .info("Core.RemoteConsole")
            .line("Client disconnected")
            .object("remoteConsoleClient", remoteConsoleClient)
            .done();

        this._clients = this._clients.filter((c) => c.id !== remoteConsoleClient.id);
    }

    private async handleClientPacket(client: RemoteConsoleClient, packet: IDatabridgePacket<any, any>): Promise<void> {
        LogBuilder
            .start()
            .level(LogBuilder.LogLevel.INFO)
            .info("Core.RemoteConsole")
            .line("Received Packet")
            .object("packet", packet)
            .done();

        if(packet.type === "KEEPALIVE") {
            client.lastKeepaliveAt = Date.now();
            return;
        }

        if(!client.authenticated) {
            if(packet.type === "AUTHENTICATION.REQUEST") {
                const authenticationPacket = packet as IDatabridgePacket<{secret: string}, any>;
                if(authenticationPacket.data.secret === this._options.secret) {
                    client.authenticated = true;
                    client.socket.sendPacket(new DatabridgePacket("AUTHENTICATION.SUCCESS", {}, {}));

                    LogBuilder
                        .start()
                        .level(LogBuilder.LogLevel.WARN)
                        .info("Core.RemoteConsole")
                        .line("Client succeeded authentication request")
                        .object("remoteConsoleClient", client)
                        .object("authenticationPacket", authenticationPacket)
                        .done();
                }
                else {
                    LogBuilder
                        .start()
                        .level(LogBuilder.LogLevel.WARN)
                        .info("Core.RemoteConsole")
                        .line("Client failed authentication request")
                        .object("remoteConsoleClient", client)
                        .object("authenticationPacket", authenticationPacket)
                        .done();
                    client.socket.close();
                }
                return;
            }

            client.socket.close();
            return;
        }

        if(packet.type === "EVENT.REGISTER") {
            const registerEventPacket = packet as IDatabridgePacket<{eventName: string}, any>;
            client.registeredEvents.push(registerEventPacket.data.eventName);
            return;
        }

        if(packet.type === "EVENT.UNREGISTER") {
            const unregisterEventPacket = packet as IDatabridgePacket<{eventName: string}, any>;
            client.registeredEvents = client.registeredEvents.filter((e) => e !== unregisterEventPacket.data.eventName);
            return;
        }

        if(packet.type === "COMMAND.RUN") {
            const commandRunPacket = packet as IDatabridgePacket<{commandLine: string}, any>;
            const result = await this._options.commandHandler.triggerString(commandRunPacket.data.commandLine);

            client.socket.sendPacket(new DatabridgePacket("COMMAND.RESULT", result, {}));
            return;
        }
    }

    private handleKeepAliveInterval(): void {
        const now = Date.now();
        this._clients.forEach((client) => {
            if(now - client.lastKeepaliveAt > 10000) {
                client.socket.close();
            }
        });
    }

    private getClientById(id: string): RemoteConsoleClient {
        return this._clients.find((c) => c.id === id);
    }

    private getClientBySocket(socket: IDatabridgeSocket): RemoteConsoleClient {
        return this._clients.find((c) => c.socket === socket);
    }
}
