import IApplication from "./IApplication";
import WorkerThreadSubprocess from "../logic/threads/WorkerThreadSubprocess";
import ExtensionServiceFactory from "../service/extensions/ExtensionServiceFactory";
import IExtensionService from "../service/extensions/IExtensionService";

export default class ThreadApplication implements IApplication {
    extensionService: IExtensionService;
    workerThread: WorkerThreadSubprocess;

    constructor(workerThread: WorkerThreadSubprocess) {
        this.workerThread = workerThread;
    }

    async start(): Promise<void> {
        this.extensionService = await ExtensionServiceFactory.fullCreateAndStart({
            contextType: "thread",
            application: this.workerThread,
            extensionService: null,
        }, (message) => console.log("INFO", "ExtensionService", message));

        console.log("INFO", "ThreadApplication.ts", "Thread Application Startup successful.");
    }

    async stop(): Promise<void> {
        await this.extensionService.stopExtensions();
        await this.workerThread.stop();

        console.log("INFO", "ThreadApplication.ts", "Thread Application shutting down.");
    }
}
