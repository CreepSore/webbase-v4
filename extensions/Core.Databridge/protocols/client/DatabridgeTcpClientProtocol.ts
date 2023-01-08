import {EventEmitter} from "events";
import * as net from "net";
import IDatabridgePacket from "../../IDatabridgePacket";
import IDatabridgeClientProtocol from "../IDatabridgeClientProtocol";
import IDatabridgeSocket from "../IDatabridgeSocket";

export default class DatabridgeTcpClientProtocol implements IDatabridgeClientProtocol {
    port: number;
    hostname: string;
    emitter: EventEmitter;
    socket: net.Socket;

    constructor(port: number, hostname: string) {
        this.port = port;
        this.hostname = hostname;
        this.emitter = new EventEmitter();
    }

    async connect(): Promise<any> {
        this.socket = net.connect(this.port, this.hostname);
        this.socket.on("connect", () => {
            this.emitter.emit("connected");
        });

        this.socket.on("data", (buf) => {
            buf.toString("utf8").split("\n").filter(str => Boolean(str)).forEach(packetstr => {
                let dbPacket = DatabridgeTcpClientProtocol.stringToPacket(packetstr);
                if(!dbPacket) return;
                this.emitter.emit("packet-received", dbPacket);
            })
        });

        this.socket.on("error", err => {
            this.emitter.emit("error", err);
        });

        this.socket.on("end", () => {
            this.emitter.emit("disconnected");
        });
    }

    async disconnect(): Promise<any> {
        this.socket.destroy();
    }

    onConnected(callback: () => void) {
        this.emitter.on("connected", callback);
        return this;
    }

    onDisconnected(callback: () => void) {
        this.emitter.on("disconnected", callback);
        return this;
    }

    onError(callback: (err: Error) => void) {
        this.emitter.on("error", callback);
        return this;
    }

    sendPacket(packet: IDatabridgePacket<any, any>) {
        this.socket.write(DatabridgeTcpClientProtocol.packetToString(packet));
        return this;
    }

    onPacketReceived(callback: (packet: IDatabridgePacket<any, any>) => void) {
        this.emitter.on("packet-received", callback);
        return this;
    }

    waitForPacket<T, T2 = any>(type: string): Promise<IDatabridgePacket<T, T2>> {
        return new Promise(res => {
            let cb = (packet: IDatabridgePacket<T, T2>) => {
                if(packet.type !== type) {
                    this.emitter.once("packet-received", cb);
                    return;
                }

                res(packet);
            };
            this.emitter.once("packet-received", cb);
        });
    }

    close() {
        this.disconnect();
        return this;
    }

    static stringToPacket(str: string) {
        try {
            let {id, time, type, data} = JSON.parse(str);
            let dbPacket: IDatabridgePacket<any, any> = {
                id,
                time,
                data,
                type,
                metadata: {}
            };
            return dbPacket;
        }
        catch(err) {
            return null;
        }
    }

    static packetToString(packet: IDatabridgePacket<any, any>) {
        // @ts-ignore
        let clonedPacket: typeof packet = {};
        Object.assign(clonedPacket, packet);
        delete clonedPacket.metadata;
        return `${JSON.stringify(clonedPacket)}\n`;
    }
}
