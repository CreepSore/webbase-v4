import IExtensionService from "../IExtensionService";
import IExtensionEnvironment from "./IExtensionEnvironment";

export default class ExtensionEnvironmentCollection extends Array<IExtensionEnvironment> {
    async applyTo(extensionService: IExtensionService): Promise<void> {
        for(const environment of this) {
            await environment.applyTo(extensionService);
        }
    }
}
