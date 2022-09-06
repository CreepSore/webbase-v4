import IApplication from "@app/IApplication";
import ExtensionService from "./ExtensionService";

export default interface IExecutionContext {
    extensionService: ExtensionService;
    contextType: "app"|"cli";
    application: IApplication;
}
