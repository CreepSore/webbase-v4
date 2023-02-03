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
                close() {
                    dbSocketEmitter.removeAllListeners();
                    socket.end();
                    return this;
                }
            };

            this.emitter.emit("client-connected", dbSocket);

            socket.on("data", (buf) => {
                let bufStr = buf.toString("utf8");
                bufStr.split("\n").filter(str => Boolean(str)).forEach(packetstr => {
                    let dbPacket = DatabridgeTcpServerProtocol.stringToPacket(packetstr);
                    if(!dbPacket) return;
                    dbSocketEmitter.emit("packet-received", dbPacket);
                });
            });

            socket.on("error", err => {
                this.emitter.emit("error", err);
            });

            socket.on("end", () => {
                this.emitter.emit("client-disconnected", dbSocket);
                dbSocketEmitter.removeAllListeners();
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

    onClientDisconnected(callback: (client: IDatabridgeSocket) => void): this {
        this.emitter.on("client-disconnected", callback);
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
        catch (err) {
            return null;
        }
    }

    static packetToString(packet: IDatabridgePacket<any, any>) {
        // @ts-ignore
        let clonedPacket: typeof packet = {};
        Object.assign(clonedPacket, packet);
        delete clonedPacket.metadata;
        return `${JSON.stringify(clonedPacket || {})}\n`;
    }
}
