import MainApplication from "@app/MainApplication";
import CliApplication from "@app/CliApplication";
import TestApplication from "@app/TestApplication";
import IExtensionService from "./IExtensionService";
import ChildApplication from "@app/ChildApplication";
import WorkerThreadSubprocess from "../../logic/threads/WorkerThreadSubprocess";
import IApplication from "../../application/IApplication";

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

export type TestExecutionContext = {
    contextType: "test";
    application: TestApplication;
    extensionService: IExtensionService;
}

export type ChildExecutionContext = {
    contextType: "child-app";
    application: ChildApplication;
    extensionService: IExtensionService;

    childType: string;
}

export type ThreadExecutionContext = {
    contextType: "thread";
    application: WorkerThreadSubprocess;
    extensionService: IExtensionService;
}

/**
 * Base ExecutionContext
 */
type ExecutionContext = (AnyExecutionContext|AppExecutionContext|CliExecutionContext|TestExecutionContext|ChildExecutionContext|ThreadExecutionContext);
export default ExecutionContext;

