import * as events from "events";
import * as wslib from "ws";
import * as crypto from "crypto";

import IDatabridgeConnectionManager from "../IDatabridgeConnectionManager";
import IDatabridgeSocket from "../IDatabridgeSocket";
import expressWs from "express-ws";
import { PermissionEntry } from "../../../../Core.Usermgmt/permissions";

export default class DatabridgeExpressWsConnectionManager implements IDatabridgeConnectionManager<string, IDatabridgeSocket<string, wslib.WebSocket>> {
    private _clients: Array<IDatabridgeSocket<string, wslib.WebSocket>> = [];
    private _clientMap: Map<string, IDatabridgeSocket<string, wslib.WebSocket>> = new Map();
    private _websocketClientIdMap: Map<wslib.WebSocket, IDatabridgeSocket<string, wslib.WebSocket>["id"]> = new Map();
    private _emitter: events.EventEmitter = new events.EventEmitter();

    get clients(): IDatabridgeSocket<string, wslib.WebSocket>[] {
        return this._clients;
    }

    start(): Promise<void> {
        return Promise.resolve();
    }

    stop(): Promise<void> {
        this._emitter.removeAllListeners();
        for(const client of this._clients) {
            if(client.raw) {
                client.raw.terminate();
            }

            client.removeAllListeners();
        }
        return Promise.resolve();
    }

    onConnectionEstablished(callback: (socket: IDatabridgeSocket<string, wslib.WebSocket>) => any): this {
        this._emitter.on("connection-established", callback);
        return this;
    }

    onConnectionDisconnected(callback: (socket: IDatabridgeSocket<string, wslib.WebSocket>) => any): this {
        this._emitter.on("connection-disconnected", callback);
        return this;
    }

    getSocketById(id: string): IDatabridgeSocket<string, wslib.WebSocket> {
        return this._clientMap.get(id);
    }

    middleware(neededPermissions: PermissionEntry[] = []): expressWs.WebsocketRequestHandler {
        return (ws, req, next) => {
            if(neededPermissions.length > 0 && !req.additionalData.authorizationHandler.hasPermissions(...neededPermissions)) {
                return next();
            }

            this._connectionEstablished(ws);

            ws.once("close", this._connectionDisconnected.bind(this));
            ws.on("message", (data) => this._onMessage(ws, data));
        };
    }

    private _connectionEstablished(websocket: wslib.WebSocket): void {
        const id = crypto.randomUUID();
        const client = {
            id,
            sendData: (data: string) => {
                websocket.send(data);
                return Promise.resolve();
            },
            onDataReceived: (callback: ((data: string) => Promise<void> | void)) => {
                this._emitter.on(`message-received/${id}`, callback);
            },
            removeAllListeners: () => {
                this._emitter.removeAllListeners(`message-received/${id}`);
            },
        };

        this._websocketClientIdMap.set(websocket, id);
        this._clientMap.set(id, client);
        this._clients.push(client);
    }

    private _connectionDisconnected(websocket: wslib.WebSocket): void {
        websocket.removeAllListeners();
    }

    private _onMessage(websocket: wslib.WebSocket, data: wslib.RawData): void {
        const websocketId = this._websocketClientIdMap.get(websocket);

        if(!websocketId) {
            return;
        }

        const dataAsString = data.toString("utf-8");
        this._emitter.emit(`message-received/${websocketId}`, dataAsString);
    }

    private _websocketToClient(websocket: wslib.WebSocket): IDatabridgeSocket<string> {
        return this._clientMap.get(this._websocketClientIdMap.get(websocket));
    }
}
