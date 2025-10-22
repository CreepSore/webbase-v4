import ExecutionContext from "./ExecutionContext";
import IExtension from "./IExtension";
import IExtensionLoader from "./loaders/IExtensionLoader";

export default interface IExtensionService {
    initialize(executionContext: ExecutionContext): void;

    registerExtension(extension: IExtension): void;
    unregisterExtension(extension: IExtension): void;

    loadExtensions(): Promise<void>;
    loadExtension(extension: IExtension): Promise<void>;
    unloadExtensions(): Promise<void>;
    unloadExtension(extension: IExtension): Promise<void>;

    startExtensions(): Promise<void>;
    startExtensions(continueOnError: boolean): Promise<void>;
    startExtension(extension: IExtension): Promise<void>;
    stopExtensions(): Promise<void>;
    stopExtension(extension: IExtension): Promise<void>;

    getExtension<T extends IExtension>(name: string | Function & { prototype: T; }): T
    getExtensionByName<T extends IExtension>(name: string): T;
    getExtensionByConstructor<T extends IExtension>(type: Function & { prototype: T }): T;

    registerExtensionLoader(extensionLoader: IExtensionLoader): void;
}
