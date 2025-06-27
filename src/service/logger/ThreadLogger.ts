
import { parentPort } from "worker_threads";
import ILogEntry from "./ILogEntry";
import ILogger from "./ILogger";
import IWorkerThread from "../../logic/threads/IWorkerThread";
import ThreadMessage from "../../logic/threads/ThreadMessage";

export default class ThreadLogger implements ILogger {
    constructor(thread: IWorkerThread) {
    }

    logSync(log: ILogEntry): void {
        parentPort.postMessage(new ThreadMessage("log", log));
    }
}
