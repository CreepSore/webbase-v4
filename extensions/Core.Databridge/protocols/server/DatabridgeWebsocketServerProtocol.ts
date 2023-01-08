import {EventEmitter} from "events";
import expressWs from "express-ws";
import IDatabridgePacket from "../../IDatabridgePacket";
import IDatabridgeServerProtocol from "../IDatabridgeServerProtocol";
import IDatabridgeSocket from "../IDatabridgeSocket";

export default class DatabridgeWebsocketServerProtocol implements IDatabridgeServerProtocol {
    port: number;
    hostname: string;
    emitter: EventEmitter;

    constructor() {
        this.emitter = new EventEmitter();
    }

    async start(): Promise<void> {
        console.log("ERROR", "DatabridgeWebSocketServerProtocol.ts", "Use 'middleware' instead of start!");
    }

    async stop(): Promise<void> {
        console.log("ERROR", "DatabridgeWebSocketServerProtocol.ts", "'stop' function is invalid.");
    }

    middleware(): expressWs.WebsocketRequestHandler {
        return (ws, req, next) => {
            let socketEmitter = new EventEmitter();
            let socket: IDatabridgeSocket = {
                sendPacket(packet) {
                    ws.send(DatabridgeWebsocketServerProtocol.packetToString(packet));
                    return this;
                },
                onPacketReceived(callback) {
                    socketEmitter.on("packet-received", callback);
                    return this;
                },
                waitForPacket<T, T2 = any>(type: string): Promise<IDatabridgePacket<T, T2>> {
                    return new Promise(res => {
                        let cb = (packet: IDatabridgePacket<T, T2>) => {
                            if(packet.type !== type) {
                                socketEmitter.once("packet-received", cb);
                                return;
                            }

                            res(packet);
                        };
                        socketEmitter.once("packet-received", cb);
                    });
                },
                close() {
                    console.log("Closed");
                    ws.close();
                    return this;
                }
            };

            ws.on("message", data => {
                let bufStr = data.toString("utf8");
                let dbPacket = DatabridgeWebsocketServerProtocol.stringToPacket(bufStr);
                if(!dbPacket) return;
                socketEmitter.emit("packet-received", dbPacket);
            });

            ws.on("error", err => {
                this.emitter.emit("error", err);
            });

            ws.on("close", () => {
                this.emitter.emit("client-disconnected", socket);
                socketEmitter.removeAllListeners();
            });

            this.emitter.emit("client-connected", socket);;
        };
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
