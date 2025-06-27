import IApplication from "./IApplication";
import ExtensionService from "@service/extensions/ExtensionService";
import WorkerThreadSubprocess from "../logic/threads/WorkerThreadSubprocess";
import EventEmitter from "events";
import { list } from "postcss";

export default class ThreadApplication implements IApplication {
    extensionService: ExtensionService = new ExtensionService();
    workerThread: WorkerThreadSubprocess;

    constructor(workerThread: WorkerThreadSubprocess) {
        this.workerThread = workerThread;
    }

    async start(): Promise<void> {
        this.extensionService.setContextInfo({
            contextType: "thread",
            application: this.workerThread,
            extensionService: this.extensionService,
        });

        console.log("INFO", "ThreadApplication.ts", "Thread Application Startup successful.");
    }

    async stop(): Promise<void> {
        await this.extensionService.stopExtensions();
        await this.workerThread.stop();

        console.log("INFO", "ThreadApplication.ts", "Thread Application shutting down.");
    }
}
