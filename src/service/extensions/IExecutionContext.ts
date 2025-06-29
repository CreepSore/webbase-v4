import MainApplication from "@app/MainApplication";
import CliApplication from "@app/CliApplication";
import TestApplication from "@app/TestApplication";
import ExtensionService from "./ExtensionService";
import ChildApplication from "@app/ChildApplication";
import WorkerThreadSubprocess from "../../logic/threads/WorkerThreadSubprocess";

/**
 * Base ExecutionContext
 */
type IExecutionContext = (IAppExecutionContext|ICliExecutionContext|ITestExecutionContext|IChildExecutionContext|IThreadExecutionContext);

export default IExecutionContext;

/**
 * Execution Context of the MainApplication Entrypoint
 */
export interface IAppExecutionContext {
    contextType: "app";
    application: MainApplication;
    extensionService: ExtensionService;
}

export interface ICliExecutionContext {
    contextType: "cli";
    application: CliApplication
    extensionService: ExtensionService;
}

export interface ITestExecutionContext {
    contextType: "test";
    application: TestApplication;
    extensionService: ExtensionService;
}

export interface IChildExecutionContext {
    contextType: "child-app";
    application: ChildApplication;
    extensionService: ExtensionService;

    childType: string;
}

export interface IThreadExecutionContext {
    contextType: "thread";
    application: WorkerThreadSubprocess;
    extensionService: ExtensionService;
}
