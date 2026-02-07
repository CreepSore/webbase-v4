export default class NoExtensionLoaderFoundError extends Error {
    private _extensionName: string;

    get extensionName(): typeof this._extensionName {
        return this._extensionName;
    }

    constructor(extensionName: string) {
        super(`No extension loader for extension [${extensionName}] registered!`);
        this._extensionName = extensionName;
    }
}
