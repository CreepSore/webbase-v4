import * as workerThreads from "node:worker_threads";

import * as crypto from "crypto";
import IThreadIO from "./io/IThreadIO";
import ThreadIO from "./io/ThreadIO";
import ThreadWorkerChannel from "./channels/ThreadWorkerChannel";
import ExtensionControlPayload from "./message-payload-types/ExtensionControlPayload";

export default class Thread {
    static scriptPath: string | null = null;

    private _id: string;
    private _isStarted: boolean = false;
    private _thread: workerThreads.Worker | null = null;
    private _io: IThreadIO | null = null;
    private _exitCode: number | null = null;

    get id(): typeof this._id {
        return this._id;
    }

    get io(): typeof this._io {
        return this._io;
    }

    constructor(id?: string) {
        this._id = id ?? crypto.randomUUID();
    }

    async start(): Promise<string> {
        if(this._isStarted) {
            return Promise.resolve(this._id);
        }

        this._isStarted = true;
        this._thread = new workerThreads.Worker(Thread.scriptPath!, {
            argv: ["--worker"],
        });

        this._thread.once("exit", code => {
            this._exitCode = code;
            this._io?.stop();
        });

        this._io = new ThreadIO(new ThreadWorkerChannel(this._thread));
        this._io.start();

        const ready = await this._io.receiveMessage("READY");
        ready.respond({id: this._id});

        return this._id;
    }

    stop(): Promise<number> {
        if(!this._isStarted) {
            return Promise.resolve(0);
        }

        this._isStarted = false;

        this._io?.stop();
        return this._thread?.terminate() || Promise.resolve(0);
    }

    async loadAndStartExtension(name: string): Promise<void> {
        if(!this._isStarted) {
            throw new Error("Thread has to be started before loading extensions!");
        }

        await this._io?.messageFactory.buildOutgoing<ExtensionControlPayload>("ExtensionControl", {
            extensionName: name,
            action: "loadAndStart",
        }).sendAndWaitForResponse();
    }

    waitForExit(): Promise<number> {
        if(this._exitCode !== null) {
            return Promise.resolve(this._exitCode);
        }

        return new Promise(res => this._thread?.once("exit", res));
    }
}
