import ExecutionContext from "./ExecutionContext";
import ExtensionService from "./ExtensionService";
import IExtensionService from "./IExtensionService";
import DirectoryExtensionEnvironment from "./environments/DirectoryExtensionEnvironment";
import ExtensionEnvironmentCollection from "./environments/ExtensionEnvironmentCollection";
import IExtensionEnvironment from "./environments/IExtensionEnvironment";
import LegacyExtensionLoader from "./loaders/LegacyExtensionLoader";

export default class ExtensionServiceFactory {
    static create(loggerFn?: (level: string, message: string) => Promise<void> | void): IExtensionService {
        const instance = new ExtensionService();
        instance.setLogger(loggerFn);
        instance.registerExtensionLoader(new LegacyExtensionLoader());

        return instance;
    }

    static async fullCreateAndStart(executionContext: ExecutionContext, loggerFn?: (level: string, message: string) => Promise<void> | void): Promise<IExtensionService> {
        const extensionService = this.create(loggerFn);
        executionContext.extensionService = extensionService;

        extensionService.initialize(executionContext);

        for(const environment of await this.createDefaultEnvironments()) {
            await environment.applyTo(extensionService);
        }

        await extensionService.loadExtensions();
        await extensionService.startExtensions();

        return extensionService;
    }

    static async createDefaultEnvironments(): Promise<ExtensionEnvironmentCollection> {
        const directoryEnvironment = new DirectoryExtensionEnvironment("extensions");
        await directoryEnvironment.initialize();

        return new ExtensionEnvironmentCollection(directoryEnvironment);
    }
}