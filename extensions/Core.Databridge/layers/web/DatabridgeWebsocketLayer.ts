import IDatabridge from "../../IDatabridge";
import IDatabridgeLayer, { DatabridgeDefaultPipelineMetadata } from "../IDatabridgeLayer";

export default class DatabridgeWebsocketLayer implements IDatabridgeLayer<string, string> {
    socket: WebSocket;
    private _started: boolean = false;
    private _connected: boolean = false;
    private _connectPromise: Promise<void>;
    private _url: string;

    get connected(): DatabridgeWebsocketLayer["_connected"] {
        return this._connected;
    }

    constructor(private url: string) {
        this._url = url;
    }

    async start(databridge: IDatabridge): Promise<void> {
        this._started = true;
        await this.connect(databridge);
    }

    async stop(databridge: IDatabridge): Promise<void> {
        this._started = false;
        this.socket.close();
        this._connected = false;
        this._connectPromise = null;
    }

    processOutbound(data: any, metadata: DatabridgeDefaultPipelineMetadata): Promise<any> {
        this.socket.send(data);
        return Promise.resolve();
    }

    private connect(databridge: IDatabridge): Promise<void> {
        if(this._connectPromise) {
            return this._connectPromise;
        }

        if(!this._started) {
            return null;
        }

        return (this._connectPromise = new Promise((res, rej) => {
            if(!this._started) {
                res();
                return;
            }

            if(this.socket) {
                this.socket.close();
            }

            this.socket = new WebSocket(this._url);

            if(!this._started) {
                this.socket.close();
                res();
                return;
            }

            this.socket.onopen = () => {
                this._connected = true;
                this._connectPromise = null;
                res();
            };

            this.socket.onerror = async() => {
                this._connected = false;
                this._connectPromise = null;
                await databridge.handleError(new Error("unexpected error"), this);
            };

            this.socket.onclose = () => {
                this._connected = false;
                this._connectPromise = null;
            };

            this.socket.onmessage = event => {
                databridge.handleInboundPacket(event.data);
            };
        }));
    }
}
