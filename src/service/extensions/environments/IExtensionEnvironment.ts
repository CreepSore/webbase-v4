import IExtensionService from "../IExtensionService";

export default interface IExtensionEnvironment {
    applyTo(extensionService: IExtensionService): Promise<void>;
}
