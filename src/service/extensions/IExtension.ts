import IExecutionContext from "./IExecutionContext";

export interface ExtensionMetadata {
    name: string;
    version: string;
    description?: string;
    author?: string;
    dependencies: Array<string>;
    resolvedDependencies?: Array<IExtension>;
    isLoaded?: boolean;
}

export interface IExtensionConstructor {
    new(): IExtension;
}

export default interface IExtension {
    metadata: ExtensionMetadata;
    
    start: (executionContext: IExecutionContext) => Promise<void>;
    stop: () => Promise<void>;
}
