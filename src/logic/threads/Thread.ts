import * as workerThreads from "node:worker_threads";

import * as uuid from "uuid";
import IThreadIO from "./io/IThreadIO";
import ThreadIO from "./io/ThreadIO";
import ThreadWorkerChannel from "./channels/ThreadWorkerChannel";

export default class Thread {
    static scriptPath: string = null;

    private _id: string;
    private _isStarted: boolean = false;
    private _thread: workerThreads.Worker;
    private _io: IThreadIO;

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
        this._io = new ThreadIO(new ThreadWorkerChannel(this._thread));
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
}
