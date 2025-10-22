import ExecutionContext from "./ExecutionContext";
import IExtension from "./IExtension";
import IExtensionService from "./IExtensionService";
import ExtensionAlreadyRegisterdError from "./errors/ExtensionAlreadyRegisteredError";
import NoExtensionLoaderFoundError from "./errors/NoExtensionLoaderFoundError";
import IExtensionLoader from "./loaders/IExtensionLoader";

export default class ExtensionService implements IExtensionService {
    private _extensions: Array<IExtension> = [];
    private _extensionsByName: Map<string, IExtension> = new Map();
    private _extensionLoaders: Set<IExtensionLoader> = new Set();
    private _executionContext: ExecutionContext;
    private _loggerFn: (message: string) => Promise<void> | void;

    initialize(executionContext: ExecutionContext): void {
        this._executionContext = executionContext;
    }

    setLogger(loggerFn?: (message: string) => Promise<void> | void) {
        this._loggerFn = loggerFn;
    }

    registerExtension(extension: IExtension): void {
        if(this.getExtensionByName(extension.metadata.name)) {
            throw new ExtensionAlreadyRegisterdError(extension.metadata.name);
        }

        this._extensions.push(extension);
        this._extensionsByName.set(extension.metadata.name, extension);
    }

    unregisterExtension(extension: IExtension): void {
        const index = this._extensions.indexOf(extension);

        this._extensions.splice(index, 1);
        this._extensionsByName.delete(extension.metadata.name);
    }

    async startExtensions(continueOnError: boolean = true): Promise<void> {
        for(const extension of this.iterateExtensions()) {
            try {
                await this.startExtension(extension);
            }
            catch(err) {
                if(!continueOnError) {
                    throw err;
                }
            }
        }
    }

    async stopExtensions(): Promise<void> {
        for(const extension of [...this.iterateExtensions()].reverse()) {
            await this.stopExtension(extension);
        }
    }

    async loadExtensions(): Promise<void> {
        for(const extension of this.iterateExtensions()) {
            await this.loadExtension(extension);
        }
    }

    async unloadExtensions(): Promise<void> {
        for(const extension of [...this.iterateExtensions()].reverse()) {
            await this.loadExtension(extension);
        }
    }

    loadExtension(extension: IExtension): Promise<void> {
        const extensionLoader = this.getCorrectExtensionLoader(extension);
        if(!extensionLoader) {
            return Promise.reject(new NoExtensionLoaderFoundError(extension.metadata.name));
        }

        extension.metadata.resolvedDependencies = this._extensions.filter(ext =>
            extension.metadata.dependencies.includes(ext.metadata?.name) ||
            extension.metadata.dependencies.includes(ext.constructor),
        );

        return extensionLoader.loadExtension(extension);
    }

    unloadExtension(extension: IExtension): Promise<void> {
        const extensionLoader = this.getCorrectExtensionLoader(extension);
        if(!extensionLoader) {
            return Promise.reject(new NoExtensionLoaderFoundError(extension.metadata.name));
        }

        return extensionLoader.unloadExtension(extension);
    }

    async startExtension(extension: IExtension): Promise<void> {
        const extensionLoader = this.getCorrectExtensionLoader(extension);
        if(!extensionLoader) {
            return Promise.reject(new NoExtensionLoaderFoundError(extension.metadata.name));
        }

        await extensionLoader.startExtension(extension, this._executionContext);
        this.log(`Started extension [${extension.metadata.name}]`);
    }

    async stopExtension(extension: IExtension): Promise<void> {
        const extensionLoader = this.getCorrectExtensionLoader(extension);
        if(!extensionLoader) {
            return Promise.reject(new NoExtensionLoaderFoundError(extension.metadata.name));
        }

        await extensionLoader.stopExtension(extension);
        this.log(`Stopped extension [${extension.metadata.name}]`);
    }

    registerExtensionLoader(extensionLoader: IExtensionLoader): void {
        this._extensionLoaders.add(extensionLoader);
    }

    getExtension<T extends IExtension>(name: string | Function & { prototype: T; }): T {
        return typeof name === "string"
            ? this.getExtensionByName(name)
            : this.getExtensionByConstructor(name);
    }

    getExtensionByName<T>(name: string): T {
        return this._extensionsByName.get(name) as T;
    }

    getExtensionByConstructor<T extends IExtension>(type: Function & { prototype: T; }): T {
        return this._extensions.find(e => e instanceof type) as T;
    }

    *iterateExtensions(): Generator<IExtension> {
        let iterated: Set<IExtension> = new Set();
        let queue = this._extensions.filter(e => !e.metadata.dependencies || e.metadata.dependencies.length === 0);

        while(queue.length > 0) {
            for(const extension of queue) {
                iterated.add(extension);
                yield extension;
            }

            queue = this._extensions.filter(e =>
                !iterated.has(e) &&
                !e.metadata.dependencies.some(d => !iterated.has(
                    typeof d === "string"
                        ? this.getExtensionByName(d)
                        : this.getExtensionByConstructor(d)
                )),
            );
        }
    }

    private getCorrectExtensionLoader(extension: IExtension): IExtensionLoader {
        const iterator = this._extensionLoaders.values();
        let currentEntry: IteratorResult<IExtensionLoader, IExtensionLoader> = iterator.next();

        if(currentEntry.done) {
            return null;
        }

        do {
            if(currentEntry.value.canHandleExtension(extension)) {
                return currentEntry.value;
            }

            currentEntry = iterator.next();
        } while(!currentEntry.done);

        return null;
    }

    private log(message: string) {
        if(!this._loggerFn) {
            return;
        }

        this._loggerFn(message);
    }
}
