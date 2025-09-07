import IExecutionContext, { ContextType } from "./IExecutionContext";

type ExtensionMetadataV1_0 = {
    metaVersion?: "1.0";

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
     * The context types this extension can run in
     */
    validContexts?: ContextType[];

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

type ExtensionMetadata = ExtensionMetadataV1_0;

export type {ExtensionMetadata};

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
