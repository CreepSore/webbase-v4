import ExecutionContext from "../ExecutionContext";
import IExtension from "../IExtension";
import IExtensionLoader from "./IExtensionLoader";

export default class LegacyExtensionLoader implements IExtensionLoader<IExtension> {
    private _startedExtensions: Set<IExtension> = new Set();

    canHandleExtension(extension: IExtension): boolean {
        return !Boolean(extension.metadata.extensionLoader);
    }

    startExtension(extension: IExtension, executionContext: ExecutionContext): Promise<void> {
        this._startedExtensions.add(extension);
        return extension.start?.(executionContext);
    }

    stopExtension(extension: IExtension): Promise<void> {
        this._startedExtensions.delete(extension);
        return extension.stop?.();
    }

    loadExtension(extension: IExtension): Promise<void> {
        return Promise.resolve();
    }

    unloadExtension(extension: IExtension): Promise<void> {
        return Promise.resolve();
    }
}
