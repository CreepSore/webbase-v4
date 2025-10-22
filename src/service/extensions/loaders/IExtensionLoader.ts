import ExecutionContext from "../ExecutionContext";
import IExtension from "../IExtension";

export default interface IExtensionLoader<TExtension extends IExtension = IExtension> {
    canHandleExtension(extension: TExtension): boolean;

    startExtension(extension: TExtension, executionContext: ExecutionContext): Promise<void>;
    stopExtension(extension: TExtension): Promise<void>;

    loadExtension(extension: TExtension): Promise<void>;
    unloadExtension(extension: TExtension): Promise<void>;
}
