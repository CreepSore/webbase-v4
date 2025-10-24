import MainApplication from "@app/MainApplication";
import CliApplication from "@app/CliApplication";
import IExtensionService from "./IExtensionService";
import IApplication from "../../application/IApplication";
import ThreadApplication from "../../application/ThreadApplication";

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

export type ThreadExecutionContext = {
    contextType: "thread";
    application: ThreadApplication;
    extensionService: IExtensionService;
}

/**
 * Base ExecutionContext
 */
type ExecutionContext = (AnyExecutionContext|AppExecutionContext|CliExecutionContext|ThreadExecutionContext);
export default ExecutionContext;

