import IExecutionContext from "./IExecutionContext";

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
    dependencies: Array<string>|Array<Function & { prototype: IExtension }>;
    /**
     * The dependencies of the extension that have to be installed by npm.
     */
    npmDependencies?: Array<string>;
    /**
     * The dependencies of the extension that have to be installed by npm.
     */
    npmDevDependencies?: Array<string>;
    /**
     * For internal use only.
     */
    resolvedDependencies?: Array<IExtension>;
    isLoaded?: boolean;
    /**
     * The basePath of the index.ts extension file.
     * Gets filled by the ExtensionService when loading the extension.
     * @example ".../extensions/Core.Web"
     */
    extensionPath?: string;
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
    start: (executionContext: IExecutionContext) => Promise<void>;
    /**
     * Gets called by ExtensionService.stopExtensions
     * @param executionContext
     */
    stop: () => Promise<void>;
}
