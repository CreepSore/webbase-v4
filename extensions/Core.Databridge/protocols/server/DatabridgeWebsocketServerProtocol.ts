import LogBuilder from "@service/logger/LogBuilder";
import {EventEmitter} from "events";
import expressWs from "express-ws";
import IDatabridgePacket from "../../IDatabridgePacket";
import IDatabridgeServerProtocol from "../IDatabridgeServerProtocol";
import IDatabridgeSocket from "../IDatabridgeSocket";

export default class DatabridgeWebsocketServerProtocol implements IDatabridgeServerProtocol {
    port: number;
    hostname: string;
    emitter: EventEmitter;
    startCallback: (wsProtocol?: DatabridgeWebsocketServerProtocol) => void;
    stopCallback: (wsProtocol?: DatabridgeWebsocketServerProtocol) => void;

    constructor(
        startCallback: (wsProtocol?: DatabridgeWebsocketServerProtocol) => void = null,
        stopCallback: (wsProtocol?: DatabridgeWebsocketServerProtocol) => void = null,
    ){
        this.emitter = new EventEmitter();
        this.startCallback = startCallback;
        this.stopCallback = stopCallback;
    }

    async start(): Promise<void>{
        if(!this.startCallback) {
            LogBuilder
                .start()
                .level("WARN")
                .info("DatabridgeWebSocketServerProtocol.ts")
                .line("Use 'middleware' instead of start!")
                .done();
            return;
        }

        this.startCallback(this);
    }

    async stop(): Promise<void>{
        if(!this.stopCallback) {
            LogBuilder
                .start()
                .level("WARN")
                .info("DatabridgeWebSocketServerProtocol.ts")
                .line("'stop' function is invalid.")
                .done();
            return;
        }

        this.stopCallback(this);
    }

    middleware(): expressWs.WebsocketRequestHandler{
        return (ws, req, next) => {
            const socketEmitter = new EventEmitter();
            const socket: IDatabridgeSocket = {
                sendPacket(packet){
                    ws.send(DatabridgeWebsocketServerProtocol.packetToString(packet));
                    return this;
                },
                onPacketReceived(callback){
                    socketEmitter.on("packet-received", callback);
                    return this;
                },
                removePacketReceived(callback: () => void){
                    this.emitter.removeListener("packet-received", callback);
                    return this;
                },
                waitForPacket<T, T2 = any>(type: string): Promise<IDatabridgePacket<T, T2>>{
                    return new Promise(res => {
                        const cb = (packet: IDatabridgePacket<T, T2>) => {
                            if(packet.type !== type) {
                                socketEmitter.once("packet-received", cb);
                                return;
                            }

                            res(packet);
                        };
                        socketEmitter.once("packet-received", cb);
                    });
                },
                close(){
                    socketEmitter.removeAllListeners();
                    ws.close();
                    return this;
                },
            };

            ws.on("message", data => {
                const bufStr = data.toString("utf8");
                const dbPacket = DatabridgeWebsocketServerProtocol.stringToPacket(bufStr);
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

            this.emitter.emit("client-connected", socket);
        };
    }

    onError(callback: (err: Error) => void){
        this.emitter.on("error", callback);
        return this;
    }

    onClientConnected(callback: (client: IDatabridgeSocket) => void): this{
        this.emitter.on("client-connected", callback);
        return this;
    }

    onClientDisconnected(callback: (client: IDatabridgeSocket) => void): this{
        this.emitter.on("client-disconnected", callback);
        return this;
    }

    static stringToPacket(str: string){
        try {
            const {id, time, type, data} = JSON.parse(str);
            const dbPacket: IDatabridgePacket<any, any> = {
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

    static packetToString(packet: IDatabridgePacket<any, any>){
        // @ts-ignore
        const clonedPacket: typeof packet = {};
        Object.assign(clonedPacket, packet);
        delete clonedPacket.metadata;
        return `${JSON.stringify(clonedPacket || {})}\n`;
    }
}
