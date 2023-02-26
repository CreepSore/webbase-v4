import IApplication from "@app/IApplication";
import MainApplication from "@app/MainApplication";
import ExtensionService from "./ExtensionService";
import CliApplication from "@app/CliApplication";

/**
 * Base ExecutionContext
 */
type IExecutionContext = (IAppExecutionContext|ICliExecutionContext);

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
