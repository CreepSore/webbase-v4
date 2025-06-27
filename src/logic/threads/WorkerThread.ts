import * as uuid from "uuid";
import * as workerThreads from "worker_threads";
import IWorkerThread from "./IWorkerThread";
import ThreadMessage from "./ThreadMessage";
import LoggerService from "../../service/logger/LoggerService";
import ILogEntry from "../../service/logger/ILogEntry";
import LogBuilder from "../../service/logger/LogBuilder";
import IObjectProxyConnection from "./object-proxy/IObjectProxyConnection";
import ThreadReceivingObjectProxyConnection from "./object-proxy/ThreadReceivingObjectProxyConnection";
import ObjectProxyFactory from "./object-proxy/ObjectProxyFactory";
import ProxyBroadcastThreadMessage from "./thread-messages/ProxyBroadcastThreadMessage";
import ProxyActionResultThreadMessage from "./thread-messages/ProxyActionResultThreadMessage";
import ProxyActionThreadMessage from "./thread-messages/ProxyActionThreadMessage";

export type WorkerThreadErrorHandler = (error: Error) => (Promise<void> | void);

export default class WorkerThread implements IWorkerThread {
    private _id: string;
    private _isStarted: boolean;
    private _worker: workerThreads.Worker;
    private _errorHandlers: Array<WorkerThreadErrorHandler> = [];
    private _proxyHandlers: Map<string, ThreadReceivingObjectProxyConnection<any>> = new Map();

    get id() {
        return this._id;
    }

    get isStarted() {
        return this._isStarted;
    }

    get worker() {
        return this._worker;
    }

    constructor(id: string = null) {
        this._id = id ?? uuid.v4();
    }

    registerProxy<T>(proxyType: string, object: T, proxyId: string = null): Promise<string> {
        const proxyIdToUse = proxyId ?? uuid.v4();
        this._proxyHandlers.set(proxyIdToUse, new ThreadReceivingObjectProxyConnection<T>(object, this));

        this.sendThreadMessage(new ProxyBroadcastThreadMessage(proxyType, proxyIdToUse, "auto"));

        return Promise.resolve(proxyIdToUse);
    }

    getProxy<T>(proxyId: string, templateObject: {prototype: T}): T {
        return ObjectProxyFactory.createSendProxy(proxyId, templateObject, this);
    }

    start(): Promise<void> {
        if(this._isStarted) {
            return;
        }

        this._isStarted = true;

        return new Promise((res, rej) => {
            // __dirname should not work -> We compile to CommonJS so it works.
            this._worker = new workerThreads.Worker(__dirname + "/WorkerThreadBootstrap.js");

            this._worker.once("online", () => {
                res();
            });

            this._worker.on("error", async(err) => {
                if(this._errorHandlers.length === 0) {
                    throw err;
                }

                for(const handler of this._errorHandlers) {
                    await handler(err);
                }
            });

            this._worker.on("message", message => {
                this.receiveThreadMessage(message);
            });

            this._worker.on("exit", () => {
                this._worker.removeAllListeners();
            });
        });
    }

    async stop(): Promise<void> {
        await this._worker.terminate();
    }

    appendErrorHandler(errorHandler: WorkerThreadErrorHandler): void {
        this._errorHandlers.push(errorHandler);
    }

    removeErrorHandler(errorHandler: WorkerThreadErrorHandler): void {
        const index = this._errorHandlers.indexOf(errorHandler);

        if(index === -1) {
            return;
        }

        this._errorHandlers.splice(index);
    }

    waitForExit(): Promise<number> {
        if(!this._worker) {
            return Promise.resolve(0);
        }

        return new Promise(res => {
            this._worker.once("exit", exitCode => {
                res(exitCode);
            });
        })
    }

    sendThreadMessage<TPayload = any>(message: ThreadMessage<TPayload>): Promise<void> {
        this._worker.postMessage(message);
        return Promise.resolve();
    }

    async receiveThreadMessage<TPayload = any>(message: ThreadMessage<TPayload>): Promise<void> {
        if(message.type === "log") {
            const parsed = message as ThreadMessage<ILogEntry>;
            parsed.payload.infos.unshift(`Thread '${this._id}'`);

            await LoggerService.log(parsed.payload);
            LoggerService.logSync(parsed.payload);
            return;
        }

        if(message.type === ProxyActionThreadMessage.type) {
            const parsed = message as ProxyActionThreadMessage;
            const proxy = this._proxyHandlers.get(parsed.payload.proxyId);

            if(!proxy) {
                return;
            }

            await proxy.receiveThreadMessage(parsed);

            return;
        }
    }

    logExitCode(): void {
        if(!this._worker) {
            return;
        }

        this._worker.once("exit", exitCode => {
            LogBuilder
                .start()
                .level(exitCode === 0 ? LogBuilder.LogLevel.INFO : LogBuilder.LogLevel.ERROR)
                .info(this.toString())
                .line(`Thread exited with code ${exitCode}`)
                .done();
        });
    }

    toString(): string {
        return `Thread '${this._id}'`;
    }
}
