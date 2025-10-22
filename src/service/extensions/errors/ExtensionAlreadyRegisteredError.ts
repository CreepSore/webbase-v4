export default class ExtensionAlreadyRegisterdError extends Error {
    private _extensionName: string;

    get extensionName() {
        return this._extensionName;
    }

    constructor(extensionName: string) {
        super(`Extension [${extensionName}] is already registered!`);
        this._extensionName = extensionName;
    }
}
