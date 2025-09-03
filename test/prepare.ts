import IExtension from "@service/extensions/IExtension";
import TestApplication from "@app/TestApplication";
import MainAppliation from "../src/application/MainApplication";

export default async function prepareTestApplication(
    keepDependencies: IExtension["metadata"]["name"][],
    preload?: (extension: IExtension) => Promise<void>,
): Promise<TestApplication> {
    const testApplication = new TestApplication(keepDependencies, preload);
    await testApplication.start();
    return testApplication;
}

export async function createMainApplication(): Promise<MainAppliation> {
    const mainApplication = new MainAppliation();
    return mainApplication;
}
