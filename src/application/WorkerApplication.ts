import * as workerThreads from "node:worker_threads";

import { WorkerExecutionContext } from "../service/extensions/ExecutionContext";
import ExtensionServiceFactory from "../service/extensions/ExtensionServiceFactory";
import IExtensionService from "../service/extensions/IExtensionService";
import IApplication from "./IApplication";
import IThreadIO from "../logic/threads/io/IThreadIO";
import ThreadIOOnThread from "../logic/threads/io/ThreadIO";
import IncomingThreadMessage from "../logic/threads/messages/IncomingThreadMessage";
import ExtensionControlPayload from "../logic/threads/message-payload-types/ExtensionControlPayload";
import IExtension from "../service/extensions/IExtension";
import IThreadChannel from "../logic/threads/channels/IThreadChannel";
import ThreadMessagePortChannel from "../logic/threads/channels/ThreadMessagePortChannel";
import LogBuilder from "../service/logger/LogBuilder";
import LoggerService from "../service/logger/LoggerService";
import MultiLogger from "../service/logger/MultiLogger";
import ConsoleLogger from "../service/logger/ConsoleLogger";
import FileLogger from "../service/logger/FileLogger";

export default class WorkerApplication implements IApplication {
    private _executionContext: WorkerExecutionContext;
    private _extensionService: IExtensionService;
    private _io: IThreadIO;
    private _onMessageReceivedCallback: (message: IncomingThreadMessage<any, any>) => any;
    private _id: string;

    get id(): string {
        return this._id;
    }

    get io(): IThreadIO {
        return this._io;
    }

    get executionContext(): WorkerExecutionContext {
        return this._executionContext;
    }

    get extensionService(): IExtensionService {
        return this._extensionService;
    }

    async start(channel: IThreadChannel = null): Promise<void> {
        this.setupLogging();
        await this.initializeEventService();
        await this.setupIO(channel);
    }

    async stop(): Promise<void> {
        this._io.stop();
    }

    private handleMessageReceived(message: IncomingThreadMessage<any, any>): Promise<void> {
        switch(message.type) {
            case "ExtensionControl": return this.handleExtensionControl(message);
            default: return Promise.resolve();
        }
    }

    private async handleExtensionControl(message: IncomingThreadMessage<ExtensionControlPayload, "ExtensionControl">): Promise<void> {
        const targettedExtensions = message.payload.extensionName === "*"
            ? this.extensionService.getExtensions()
            : [this.extensionService.getExtensionByName(message.payload.extensionName)];

        if(!targettedExtensions || targettedExtensions.length === 0) {
            message.respond({success: false});
            return;
        }

        for(const extension of targettedExtensions) {
            const dependencies = this.getLoadOrder(extension).reverse();
            for(const dependency of dependencies) {
                if(message.payload.action === "load" || message.payload.action === "loadAndStart") {
                    await this._extensionService.loadExtension(dependency);
                }

                if(message.payload.action === "start" || message.payload.action === "loadAndStart") {
                    await this._extensionService.startExtension(dependency);
                }
            }

            if(message.payload.action === "load" || message.payload.action === "loadAndStart") {
                await this._extensionService.loadExtension(extension);
            }

            if(message.payload.action === "start" || message.payload.action === "loadAndStart") {
                await this._extensionService.startExtension(extension);
            }
        }

        message.respond({success: true});
    }

    private getLoadOrder(extension: IExtension): Array<IExtension> {
        const result = [];

        for(const dependency of extension.metadata.dependencies) {
            const resolvedDependency = this._extensionService.getExtension<IExtension>(dependency);
            result.push(...this.getLoadOrder(resolvedDependency));
        }

        return result;
    }

    private async initializeEventService(): Promise<void> {
        this._executionContext = {
            contextType: "worker",
            application: this,
            extensionService: null
        };

        const environments = await ExtensionServiceFactory.createDefaultEnvironments();
        this._extensionService = ExtensionServiceFactory.create((level, message) => console.log(level, "ExtensionService", message));
        this._extensionService.initialize(this._executionContext);
        environments.applyTo(this._extensionService);
    }

    private setupLogging(): void {
        LoggerService.addLogger(
            new MultiLogger()
                .addLogger(new ConsoleLogger(true))
                .addLogger(new FileLogger(`logs/out_thread_${this._id}_${new Date().toISOString().replace(/(\d+)-(\d+)-(\d+)T(\d+):(\d+):(\d+).(\d+)Z/, "$1_$2_$3_$4_$5")}.log`)),
            "ThreadMultiLogger"
        );

        LoggerService.hookConsoleLog();

        const oldOnDone = LogBuilder.onDone;
        LogBuilder.onDone = (log) => {
            log.infos.unshift(`Thread:${this._id}`)
            return oldOnDone(log);
        }
    }

    private async setupIO(channel: IThreadChannel = null): Promise<void> {
        this._io = new ThreadIOOnThread(channel ?? new ThreadMessagePortChannel(workerThreads.parentPort));
        this._io.start();

        const readyTelegram = this._io.messageFactory.buildReadyTelegram();
        readyTelegram.send();
        const response = await readyTelegram.waitForResponse<{id: string}>();
        this._id = response.id;

        await LogBuilder
            .start()
            .level(LogBuilder.LogLevel.INFO)
            .info("WorkerApplication", "setupIO")
            .line(`Handshake done, got id [${this._id}]`)
            .done();

        this._onMessageReceivedCallback = message => this.handleMessageReceived(message);
        this._io.onMessageReceived(this._onMessageReceivedCallback);
    }
}
