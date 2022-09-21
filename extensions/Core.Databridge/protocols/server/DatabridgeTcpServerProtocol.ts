import {EventEmitter} from "events";
import * as net from "net";
import IDatabridgePacket from "../../IDatabridgePacket";
import IDatabridgeServerProtocol from "../IDatabridgeServerProtocol";
import IDatabridgeSocket from "../IDatabridgeSocket";

export default class DatabridgeTcpServerProtocol implements IDatabridgeServerProtocol {
    port: number;
    hostname: string;
    emitter: EventEmitter;
    server: net.Server;

    constructor(port: number, hostname: string = "127.0.0.1") {
        this.port = port;
        this.hostname = hostname;
        this.emitter = new EventEmitter();
    }

    async start(): Promise<void> {
        this.server = net.createServer((socket) => {
            let dbSocketEmitter = new EventEmitter();
            let dbSocket: IDatabridgeSocket = {
                sendPacket(packet) {
                    socket.write(DatabridgeTcpServerProtocol.packetToString(packet));
                    return this;
                },
                onPacketReceived(callback) {
                    dbSocketEmitter.on("packet-received", callback);
                    return this;
                },
                waitForPacket<T, T2 = any>(type: string): Promise<IDatabridgePacket<T, T2>> {
                    return new Promise(res => {
                        let cb = (packet: IDatabridgePacket<T, T2>) => {
                            if(packet.type !== type) {
                                dbSocketEmitter.once("packet-received", cb);
                                return;
                            }

                            res(packet);
                        };
                        dbSocketEmitter.once("packet-received", cb);
                    });
                },
            };

            this.emitter.emit("client-connected", dbSocket);
            socket.on("data", (buf) => {
                let dbPacket = DatabridgeTcpServerProtocol.bufferToPacket(buf);
                dbSocketEmitter.emit("packet-received", dbPacket);
            });

            socket.on("error", err => {
                this.emitter.emit("error", err);
            });
        });

        this.server.listen(this.port, this.hostname);
    }

    async stop(): Promise<void> {
        this.server.close();
        this.server.removeAllListeners();
    }

    onError(callback: (err: Error) => void) {
        this.emitter.on("error", callback);
        return this;
    }

    onClientConnected(callback: (client: IDatabridgeSocket) => void): this {
        this.emitter.on("client-connected", callback);
        return this;
    }

    static bufferToPacket(buf: Buffer) {
        let {id, time, type, data} = JSON.parse(buf.toString("utf8"));
        let dbPacket: IDatabridgePacket<any, any> = {
            id,
            time,
            data,
            type,
            metadata: {}
        };

        return dbPacket;
    }

    static packetToString(packet: IDatabridgePacket<any, any>) {
        // @ts-ignore
        let clonedPacket: typeof packet = {};
        Object.assign(clonedPacket, packet);
        delete clonedPacket.metadata;
        return `${JSON.stringify(clonedPacket, null, 2)}\n`;
    }
}
