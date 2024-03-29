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
            const dbSocketEmitter = new EventEmitter();
            const dbSocket: IDatabridgeSocket = {
                sendPacket(packet) {
                    socket.write(DatabridgeTcpServerProtocol.packetToString(packet));
                    return this;
                },
                onPacketReceived(callback) {
                    dbSocketEmitter.on("packet-received", callback);
                    return this;
                },
                removePacketReceived(callback: () => void) {
                    this.emitter.removeListener("packet-received", callback);
                    return this;
                },
                waitForPacket<T, T2 = any>(type: string): Promise<IDatabridgePacket<T, T2>> {
                    return new Promise(res => {
                        const cb = (packet: IDatabridgePacket<T, T2>): IDatabridgePacket<T, T2> => {
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
                },
            };

            this.emitter.emit("client-connected", dbSocket);

            socket.on("error", err => {
                this.emitter.emit("client-disconnected", dbSocket);
                this.emitter.emit("error", err);
            });

            socket.on("data", (buf) => {
                const bufStr = buf.toString("utf8");
                bufStr.split("\n").filter(str => Boolean(str)).forEach(packetstr => {
                    const dbPacket = DatabridgeTcpServerProtocol.stringToPacket(packetstr);
                    if(!dbPacket) return;
                    dbSocketEmitter.emit("packet-received", dbPacket);
                });
            });

            socket.on("end", () => {
                this.emitter.emit("client-disconnected", dbSocket);
                dbSocketEmitter.removeAllListeners();
            });
        });

        this.server.on("error", (err) => {
            console.log("ERROR", "DatabridgeTcpServerProtocol", err.stack);
        });

        this.server.listen(this.port, this.hostname);
    }

    async stop(): Promise<void> {
        this.server.close();
        this.server.removeAllListeners();
    }

    onError(callback: (err: Error) => void): this {
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

    static stringToPacket<T, T2>(str: string): IDatabridgePacket<T, T2> {
        try {
            const {id, time, type, data} = JSON.parse(str);
            const dbPacket: IDatabridgePacket<T, any> = {
                id,
                time,
                data,
                type,
                metadata: {},
            };

            return dbPacket;
        }
        catch (err) {
            return null;
        }
    }

    static packetToString(packet: IDatabridgePacket<any, any>): string {
        // @ts-ignore
        const clonedPacket: typeof packet = {};
        Object.assign(clonedPacket, packet);
        delete clonedPacket.metadata;
        return `${JSON.stringify(clonedPacket || {})}\n`;
    }
}
