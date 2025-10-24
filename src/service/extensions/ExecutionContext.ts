import MainApplication from "@app/MainApplication";
import CliApplication from "@app/CliApplication";
import IExtensionService from "./IExtensionService";
import WorkerThreadSubprocess from "../../logic/threads/WorkerThreadSubprocess";
import IApplication from "../../application/IApplication";
import WorkerApplication from "../../application/WorkerApplication";

/**
 * Execution Context of the MainApplication Entrypoint
 */
export type AnyExecutionContext = {
    contextType: "any";
    application?: IApplication;
    extensionService: IExtensionService;
}

export type AppExecutionContext = {
    contextType: "app";
    application: MainApplication;
    extensionService: IExtensionService;
}

export type CliExecutionContext = {
    contextType: "cli";
    application: CliApplication
    extensionService: IExtensionService;
}

export type WorkerExecutionContext = {
    contextType: "worker";
    application: WorkerApplication;
    extensionService: IExtensionService;
}

export type ThreadExecutionContext = {
    contextType: "thread";
    application: WorkerThreadSubprocess;
    extensionService: IExtensionService;
}

/**
 * Base ExecutionContext
 */
type ExecutionContext = (AnyExecutionContext|AppExecutionContext|CliExecutionContext|WorkerExecutionContext|ThreadExecutionContext);
export default ExecutionContext;

