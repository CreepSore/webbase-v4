import IDatabridgePacket from "../IDatabridgePacket";
import IDatabridgeClientProtocol from "../protocols/IDatabridgeClientProtocol";

export default class DatabridgeWebsocketClient implements IDatabridgeClientProtocol {
    websocketUrl: string;
    ws: WebSocket;
    callbacks: {callback: Function, type: string}[] = [];

    constructor(websocketUrl: string) {
        this.websocketUrl = websocketUrl;
        this.callbacks = [];
    }

    async connect(): Promise<any> {
        this.ws = new WebSocket(this.websocketUrl);
        this.ws.addEventListener("open", () => {
            this.callbacks.filter(c => c.type === "onConnected").forEach(cb => cb.callback());
        });

        this.ws.addEventListener("close", () => {
            this.callbacks.filter(c => c.type === "onDisconnected").forEach(cb => cb.callback());
        });

        this.ws.addEventListener("error", () => {
            this.callbacks.filter(c => c.type === "onError").forEach(cb => cb.callback());
        });

        this.ws.addEventListener("message", (ev) => {
            let data = JSON.parse(ev.data) as IDatabridgePacket<any, any>;
            this.callbacks.filter(c => c.type === "onData").forEach(cb => cb.callback(data));
        });
    }

    async disconnect(): Promise<any> {
        this.ws.close();
    }

    onConnected(callback: () => void): this {
        this.callbacks.push({callback, type: "onConnected"});
        return this;
    }

    onDisconnected(callback: () => void): this {
        this.callbacks.push({callback, type: "onDisconnected"});
        return this;
    }

    sendPacket(packet: IDatabridgePacket<any, any>): this {
        this.ws.send(JSON.stringify(packet));
        return this;
    }

    onPacketReceived<T, T2 = any>(callback: (packet: IDatabridgePacket<T, T2>) => void): this {
        this.callbacks.push({callback, type: "onData"});
        return this;
    }

    async waitForPacket<T, T2 = any>(type: string): Promise<IDatabridgePacket<T, T2>> {
        throw new Error("Method not implemented.");
    }
}
