import ExecutionContext from "./ExecutionContext";
import IExtensionLoader from "./loaders/IExtensionLoader";

export interface ExtensionMetadata {
    /**
     * The name of the extension.
     * @example "Core.Web"
     */
    name: string;
    /**
     * The version of the extension.
     * @example "1.0.0"
     */
    version: string;
    /**
     * The description of the extension.
     */
    description?: string;
    /**
     * The author of the extension.
     */
    author?: string;
    /**
     * The dependencies of the extension.
     * @example ["Core", "Core.Web"]
     * [Core, CoreWeb]
     */
    dependencies: Array<string | Function & { prototype: IExtension }>;
    /**
     * For internal use only.
     */
    resolvedDependencies?: Array<IExtension>;
    /**
     * The basePath of the index.ts extension file.
     * Gets filled by the ExtensionService when loading the extension.
     * @example ".../extensions/Core.Web"
     */
    extensionPath?: string;
    /**
     * Defines the ExtensionLoader to use to handle the lifetime of this extension
     */
    extensionLoader?: Function & { prototype: IExtensionLoader };
    /**
     * Forces this extension to be loaded and started for every thread created.
     */
    forceLoadInThreadContext?: boolean;
}

export interface IExtensionConstructor {
    new(): IExtension;
}

export default interface IExtension {
    metadata: ExtensionMetadata;

    /**
     * Gets called by ExtensionService.startExtensions
     * @param executionContext
     */
    start: (executionContext: ExecutionContext) => Promise<void>;

    /**
     * Gets called by ExtensionService.stopExtensions
     * @param executionContext
     */
    stop: () => Promise<void>;
}
