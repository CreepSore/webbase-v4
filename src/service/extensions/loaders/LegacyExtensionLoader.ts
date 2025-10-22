import ExecutionContext from "../ExecutionContext";
import IExtension from "../IExtension";
import IExtensionLoader from "./IExtensionLoader";

export default class LegacyExtensionLoader implements IExtensionLoader<IExtension> {
    canHandleExtension(extension: IExtension): boolean {
        return !Boolean(extension.metadata.extensionLoader);
    }

    startExtension(extension: IExtension, executionContext: ExecutionContext): Promise<void> {
        return extension.start?.(executionContext);
    }

    stopExtension(extension: IExtension): Promise<void> {
        return extension.stop?.();
    }

    loadExtension(extension: IExtension): Promise<void> {
        return Promise.resolve();
    }

    unloadExtension(extension: IExtension): Promise<void> {
        return Promise.resolve();
    }
}
