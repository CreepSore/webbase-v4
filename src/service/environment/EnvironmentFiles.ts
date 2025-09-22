import EnvironmentFile from "./EnvironmentFile";

export default class EnvironmentFiles extends Array<EnvironmentFile> {
    /**
     * Applies all EnvironmentFiles to process.env
     */
    apply() {
        for(const envFile of this) {
            envFile.apply();
        }
    }
}
