import IDatabridgePacket from "../../IDatabridgePacket";
import IDatabridgeClientProtocol from "../IDatabridgeClientProtocol";

export default class DatabridgeWebsocketClient implements IDatabridgeClientProtocol {
    websocketUrl: string;
    ws: WebSocket;
    callbacks: {callback: Function, type: string}[] = [];

    constructor(websocketUrl: string) {
        this.websocketUrl = websocketUrl;

        if(this.websocketUrl.startsWith("/")) {
            const url = new URL(this.websocketUrl, location.origin);
            url.protocol = url.protocol.replace("http", "ws");
            this.websocketUrl = url.href;
        }
        else if(this.websocketUrl.startsWith("http")) {
            this.websocketUrl = this.websocketUrl.replace("http", "ws");
        }

        this.callbacks = [];
    }

    connect(): Promise<void> {
        return new Promise(res => {
            this.ws = new WebSocket(this.websocketUrl);
            this.ws.onopen = () => {
                this.callbacks.filter(c => c.type === "onConnected").forEach(cb => cb.callback());
                res();
            };

            this.ws.onclose = () => {
                this.callbacks.filter(c => c.type === "onDisconnected").forEach(cb => cb.callback());
            };

            this.ws.onerror = () => {
                this.callbacks.filter(c => c.type === "onError").forEach(cb => cb.callback());
            };

            this.ws.onmessage = (ev) => {
                const data = JSON.parse(ev.data) as IDatabridgePacket<any, any>;
                this.callbacks.filter(c => c.type === "onData").forEach(cb => cb.callback(data));
            };
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
        if(!this.ws) throw new Error("Connection has not been established yet.");

        this.ws.send(JSON.stringify(packet));
        return this;
    }

    close(): this {
        this.disconnect();
        return this;
    }

    onPacketReceived<T, T2 = any>(callback: (packet: IDatabridgePacket<T, T2>) => void): this {
        this.callbacks.push({callback, type: "onData"});
        return this;
    }

    removePacketReceived(callback: () => void): this {
        this.callbacks = this.callbacks.filter(c => c.callback !== callback);
        return this;
    }

    async waitForPacket<T, T2 = any>(type: string): Promise<IDatabridgePacket<T, T2>> {
        throw new Error("Method not implemented.");
    }
}
