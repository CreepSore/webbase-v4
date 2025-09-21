import * as workerThreads from "worker_threads";

import * as uuid from "uuid";

import LogBuilder from "../../service/logger/LogBuilder";
import IWorkerThread from "./IWorkerThread";
import LoggerService from "../../service/logger/LoggerService";
import ThreadLogger from "../../service/logger/ThreadLogger";
import ThreadMessage from "./ThreadMessage";
import ThreadReceivingObjectProxyConnection from "./object-proxy/ThreadReceivingObjectProxyConnection";
import ProxyBroadcastThreadMessage from "./thread-messages/ProxyBroadcastThreadMessage";
import ObjectProxyFactory from "./object-proxy/ObjectProxyFactory";
import ProxyActionThreadMessage from "./thread-messages/ProxyActionThreadMessage";
import ProxyActionResultThreadMessage from "./thread-messages/ProxyActionResultThreadMessage";
import ThreadSendingObjectProxyConnection from "./object-proxy/ThreadSendingObjectProxyConnection";
import ThreadApplication from "../../application/ThreadApplication";

export default class WorkerThreadSubprocess implements IWorkerThread {
    private _id: string;
    private _isStarted: boolean;
    private _proxyHandlers: Map<string, ThreadReceivingObjectProxyConnection<any>> = new Map();
    private _registeredProxies: Map<string, ThreadSendingObjectProxyConnection> = new Map();
    private _threadApplication: ThreadApplication = new ThreadApplication(this);

    get id(): string {
        return this._id;
    }

    get isStarted(): boolean {
        return this._isStarted;
    }

    async start(): Promise<void> {
        if(this._isStarted) {
            return;
        }

        this._isStarted = true;

        this.initializeLogging();
        this.initializeGlobalErrorHandler();

        await this._threadApplication.start();

        this.startListening();
        await this.initializeProxies();
    }

    async stop(): Promise<void> {
        if(!this._isStarted) {
            return;
        }

        this._isStarted = false;

        this.stopListening();
    }

    async registerProxy<T>(proxyType: string, object: T, proxyId: string = null): Promise<string> {
        const proxyIdToUse = proxyId ?? uuid.v4();
        this._proxyHandlers.set(proxyIdToUse, new ThreadReceivingObjectProxyConnection<T>(object, this));

        await this.sendThreadMessage(new ProxyBroadcastThreadMessage(proxyType, proxyIdToUse, "auto"));
        return proxyIdToUse;
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

    private async initializeProxies(): Promise<void> {
        await this.registerProxy("ThreadApplication", this._threadApplication, "ThreadApplication");
    }

    private startListening(): void {
        workerThreads.parentPort.on("message", message => {
            this.receiveThreadMessage(message);
        });
    }

    private stopListening(): void {
        workerThreads.parentPort.removeAllListeners();
    }

    private initializeLogging(): void {
        LoggerService
            .addLogger(new ThreadLogger(this))
            .hookConsoleLog();
    }

    private initializeGlobalErrorHandler(): void {
        process.on("uncaughtException", (error, origin) => {
            LogBuilder
                .start()
                .level(LogBuilder.LogLevel.CRITICAL)
                .info("Core")
                .line("CRITICAL ERROR OCCURED - THREAD WILL CRASH")
                .object("error", error)
                .object("origin", origin)
                .appendCallStack()
                .done();

            process.exit(1);
        });

        process.on("unhandledRejection", (reason, promise) => {
            LogBuilder
                .start()
                .level(LogBuilder.LogLevel.CRITICAL)
                .info("Core")
                .line("UNHANDLED REJECTION OCCURED - THREAD WILL CRASH")
                .object("reason", reason)
                .appendCallStack()
                .done();

            process.exit(1);
        });
    }

    sendThreadMessage<TPayload = any>(message: ThreadMessage<TPayload>): Promise<void> {
        workerThreads.parentPort.postMessage(message);
        return Promise.resolve();
    }

    async receiveThreadMessage<TPayload = any>(message: ThreadMessage<TPayload>): Promise<void> {
        switch(message.type) {
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

            case ProxyBroadcastThreadMessage.type: {
                break;
            }

            default: break;
        }
    }
}
