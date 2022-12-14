import IApplication from "@app/IApplication";
import MainApplication from "@app/MainApplication";
import ExtensionService from "./ExtensionService";
import {Configuration} from "webpack";

export default interface IExecutionContext {
    extensionService: ExtensionService;
    contextType: "app"|"cli";
    application: IApplication;
}

export interface IAppExecutionContext extends IExecutionContext {
    contextType: "app",
    application: MainApplication;
}

// TODO: Implement after implementing CliApplication
export interface ICliExecutionContext extends IExecutionContext {
    contextType: "cli"
}
