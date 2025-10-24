import IExtensionService from "../IExtensionService";
import IExtensionEnvironment from "./IExtensionEnvironment";

export default class ExtensionEnvironmentCollection extends Array<IExtensionEnvironment> {
    applyTo(extensionService: IExtensionService) {
        for(const environment of this) {
            environment.applyTo(extensionService);
        }
    }
}
