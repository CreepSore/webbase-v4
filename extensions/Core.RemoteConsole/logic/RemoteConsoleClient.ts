import { ICommandExecutionResult } from "@app/CommandHandler";
import DatabridgePacket from "@extensions/Core.Databridge/DatabridgePacket";
import DatabridgeTcpClientProtocol from "@extensions/Core.Databridge/protocols/client/DatabridgeTcpClientProtocol";
import LogBuilder from "@service/logger/LogBuilder";
import LoggerService from "@service/logger/LoggerService";
import * as readline from "readline";

export interface RemoteConsoleClientOptions {
    host: string;
    port: number;
    secret: string;
}

export default class RemoteConsoleClient extends DatabridgeTcpClientProtocol {
    private _options: RemoteConsoleClientOptions;
    private _readlineInterface: readline.Interface;
    private _keepaliveInterval: NodeJS.Timeout;

    get options(): typeof this._options {
        return this._options;
    }

    constructor(options: RemoteConsoleClientOptions) {
        super(options.port, options.host);
        this._options = options;
    }

    async start(): Promise<void> {
        await this.connect();

        this.onConnected(() => this.handleConnected());
        this.onDisconnected(() => this.handleDisconnected());
        this.onPacketReceived(packet => this.handlePacketReceived(packet));
        this.onError(() => {});
    }

    async stop(): Promise<void> {
        this._readlineInterface.close();
    }

    private handleLine(line: string): void {
        const trimmedInput = line.trim();

        if(/^\.log +enable/.test(trimmedInput)) {
            this.registerToEvent("LOG");
            return;
        }

        if(/^\.log +disable/.test(trimmedInput)) {
            this.unregisterFromEvent("LOG");
            return;
        }

        this.runCommand(line);
    }

    private handleConnected(): void {
        LogBuilder
            .start()
            .level("INFO")
            .info("Core.RemoteConsole.Client")
            .line("Connection established")
            .done();

        this._readlineInterface = readline.createInterface(process.stdin);
        this._readlineInterface.on("line", line => this.handleLine(line));
        this._keepaliveInterval = setInterval(() => this.handleKeepaliveInterval(), 8000);

        this.authenticate();
    }

    private async handleDisconnected(): Promise<void> {
        LogBuilder
            .start()
            .level("INFO")
            .info("Core.RemoteConsole.Client")
            .line("Connection closed")
            .done();

        clearInterval(this._keepaliveInterval);
        await this.stop();
    }

    private runCommand(line: string): void {
        this.sendPacket(new DatabridgePacket("COMMAND.RUN", {commandLine: line}, {}));
    }

    private handlePacketReceived(packet: DatabridgePacket<any, any>): void {
        if(packet.type === "EVENT.LOG") {
            LoggerService.log({
                ...packet.data,
                date: new Date(packet.data.date),
            });
            return;
        }

        if(packet.type === "COMMAND.RESULT") {
            const commandResultPacket = packet as DatabridgePacket<ICommandExecutionResult, {result: any}>;
            LogBuilder
                .start()
                .level("INFO")
                .info("Core.RemoteConsole.Client")
                .line(commandResultPacket.data.result as string)
                .line(...commandResultPacket.data.log)
                .done();

            return;
        }
    }

    private registerToEvent(eventName: string): void {
        this.sendPacket(new DatabridgePacket("EVENT.REGISTER", {eventName}, {}));
    }

    private unregisterFromEvent(eventName: string): void {
        this.sendPacket(new DatabridgePacket("EVENT.UNREGISTER", {eventName}, {}));
    }

    private handleKeepaliveInterval(): void {
        this.sendPacket(new DatabridgePacket("KEEPALIVE", {}, {}));
    }

    private authenticate(): void {
        this.sendPacket(new DatabridgePacket("AUTHENTICATION.REQUEST", {secret: this.options.secret}, {}));
    }
}
