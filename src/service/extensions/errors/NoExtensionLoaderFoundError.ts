export default class NoExtensionLoaderFoundError extends Error {
    private _extensionName: string;

    get extensionName() {
        return this._extensionName;
    }

    constructor(extensionName: string) {
        super(`No extension loader for extension [${extensionName}] registered!`);
        this._extensionName = extensionName;
    }
}
