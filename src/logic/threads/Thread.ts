import * as workerThreads from "node:worker_threads";

import * as uuid from "uuid";
import IThreadIO from "./io/IThreadIO";
import ThreadIO from "./io/ThreadIO";
import ThreadWorkerChannel from "./channels/ThreadWorkerChannel";
import ExtensionControlPayload from "./message-payload-types/ExtensionControlPayload";
import LogBuilder from "../../service/logger/LogBuilder";

export default class Thread {
    static scriptPath: string = null;

    private _id: string;
    private _isStarted: boolean = false;
    private _thread: workerThreads.Worker;
    private _io: IThreadIO;
    private _exitCode: number = null;

    get id() {
        return this._id;
    }

    get io() {
        return this._io;
    }

    constructor(id: string = null) {
        this._id = id ?? uuid.v4();
    }

    async start(): Promise<string> {
        if(this._isStarted) {
            return;
        }

        this._isStarted = true;
        this._thread = new workerThreads.Worker(Thread.scriptPath, {
            argv: ["--worker"]
        });

        this._thread.once("exit", code => {
            this._exitCode = code;
            this._io.stop();
        });

        this._io = new ThreadIO(new ThreadWorkerChannel(this._thread));

        this._io.onMessageReceived(message => {
            LogBuilder
                .start()
                .level(LogBuilder.LogLevel.INFO)
                .info("OIDA")
                .line("OIDA")
                .object("message", message.toPayload())
                .done();
        });

        this._io.start();
        const ready = await this._io.receiveMessage("READY");
        ready.respond({id: this._id});

        return this._id;
    }

    stop(): Promise<number> {
        if(!this._isStarted) {
            return;
        }

        this._isStarted = false;

        this._io.stop();
        return this._thread.terminate();
    }

    async loadAndStartExtension(name: string): Promise<void> {
        if(!this._isStarted) {
            throw new Error("Thread has to be started before loading extensions!");
        }

        await this._io.messageFactory.buildOutgoing<ExtensionControlPayload>("ExtensionControl", {
            extensionName: name,
            action: "loadAndStart",
        }).sendAndWaitForResponse();
    }

    waitForExit(): Promise<number> {
        if(this._exitCode !== null) {
            return Promise.resolve(this._exitCode);
        }

        return new Promise(res => this._thread.once("exit", res));
    }
}
