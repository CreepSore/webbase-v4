import IExtension from "@service/extensions/IExtension";
import TestApplication from "@app/TestApplication";

export default async function prepareTestApplication(
    keepDependencies: IExtension["metadata"]["name"][],
    preload?: (extension: IExtension) => Promise<void>,
): Promise<TestApplication> {
    const testApplication = new TestApplication(keepDependencies, preload);
    await testApplication.start();
    return testApplication;
}
