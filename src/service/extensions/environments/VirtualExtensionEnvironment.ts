import IExtension from "../IExtension";
import IExtensionService from "../IExtensionService";
import IExtensionEnvironment from "./IExtensionEnvironment";

export default class VirtualExtensionEnvironment implements IExtensionEnvironment {
    extensions: Set<IExtension> = new Set();
    ignoreErrors: boolean;

    constructor(extensions: Array<IExtension> = [], ignoreErrors: boolean = false) {
        this.ignoreErrors = ignoreErrors;

        for(const extension of extensions) {
            this.extensions.add(extension);
        }
    }

    addExtension(extension: IExtension): this {
        this.extensions.add(extension);
        return this;
    }

    removeExtension(extension: IExtension): this {
        this.extensions.delete(extension);
        return this;
    }

    applyTo(extensionService: IExtensionService): Promise<void> {
        const iterator = this.extensions.values();
        let currentEntry: IteratorResult<IExtension, IExtension>;

        do {
            currentEntry = iterator.next();
            if(currentEntry.done) {
                return Promise.resolve();
            }

            try {
                extensionService.registerExtension(currentEntry.value);
            }
            catch(err) {
                if(!this.ignoreErrors) {
                    throw err;
                }
            }
        } while(true);
    }
}
