import EnvironmentFile from "./EnvironmentFile";

export default class EnvironmentFiles extends Array<EnvironmentFile> {
    /**
     * Applies all EnvironmentFiles to process.env
     */
    apply(): void {
        for(const envFile of this) {
            envFile.apply();
        }
    }
}
