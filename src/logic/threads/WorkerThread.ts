import * as uuid from "uuid";

import * as workerThreads from "worker_threads";
import * as events from "events";

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
import ThreadSendingObjectProxyConnection from "./object-proxy/ThreadSendingObjectProxyConnection";

export type WorkerThreadErrorHandler = (error: Error) => (Promise<void> | void);

export default class WorkerThread extends events.EventEmitter implements IWorkerThread {
    private _id: string;
    private _isStarted: boolean;
    private _worker: workerThreads.Worker;
    private _errorHandlers: Array<WorkerThreadErrorHandler> = [];
    private _proxyHandlers: Map<string, ThreadReceivingObjectProxyConnection<any>> = new Map();
    private _registeredProxies: Map<string, ThreadSendingObjectProxyConnection> = new Map();

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
        super();
        this._id = id ?? uuid.v4();
    }

    registerProxy<T>(proxyType: string, object: T, proxyId: string = null): Promise<string> {
        const proxyIdToUse = proxyId ?? uuid.v4();
        this._proxyHandlers.set(proxyIdToUse, new ThreadReceivingObjectProxyConnection<T>(object, this));

        this.sendThreadMessage(new ProxyBroadcastThreadMessage(proxyType, proxyIdToUse, "auto"));

        return Promise.resolve(proxyIdToUse);
    }

    getProxy<T>(proxyId: string, templateObject: {prototype: T}): T {
        const proxy = ObjectProxyFactory.createSendProxy(proxyId, templateObject, this);
        this._registeredProxies.set(proxyId, proxy.connection);
        return proxy.proxy;
    }

    getStaticProxy<T>(proxyId: string, templateObject: {prototype: T}): T {
        const proxy = ObjectProxyFactory.createStaticSendProxy(proxyId, templateObject, this);
        this._registeredProxies.set(proxyId, proxy.connection);
        return proxy.proxy;
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
        this.emit("message", message);

        switch(message.type) {
            case "log": {
                const parsed = message as ThreadMessage<ILogEntry>;
                parsed.payload.infos.unshift(`Thread '${this._id}'`);

                await LoggerService.log(parsed.payload);
                LoggerService.logSync(parsed.payload);
                break;
            }

            case ProxyActionThreadMessage.type: {
                const parsed = message as ProxyActionThreadMessage;
                const proxy = this._proxyHandlers.get(parsed.payload.proxyId);

                if(!proxy) {
                    return;
                }

                await proxy.receiveThreadMessage(parsed);
                break;
            }

            case ProxyActionResultThreadMessage.type: {
                for(const proxy of this._registeredProxies.values()) {
                    proxy.receiveThreadMessage(message);
                }
                break;
            }
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
    
    waitForMessage<TMessage extends ThreadMessage<any>>(filter: (message: TMessage) => boolean): Promise<TMessage> {
        return new Promise(res => {
            const callback = (message: TMessage) => {
                if(filter(message)) {
                    res(message);
                    this.removeListener("message", callback);
                }
            };

            this.on("message", callback);
        });
    }

    async waitForProxyRegistered(proxyType: string): Promise<void> {
        await this.waitForMessage<ProxyBroadcastThreadMessage>(t => t.payload.proxyType === proxyType);
    }

    override addListener(eventName: "message", listener: (message: ThreadMessage<any>) => void): this {
        return super.addListener(eventName, listener);
    }

    override on(eventName: "message", listener: (message: ThreadMessage<any>) => void): this {
        return super.on(eventName, listener);
    }

    override once(eventName: "message", listener: (message: ThreadMessage<any>) => void): this {
        return super.once(eventName, listener);
    }

    override removeListener(eventName: "message", listener: (message: ThreadMessage<any>) => void): this {
        return super.removeListener(eventName, listener);
    }
}
