import IExtension, { IExtensionConstructor } from "@service/extensions/IExtension";
import TestApplication from "@app/TestApplication";

export default async function prepareTestApplication(keepDependencies: IExtension["metadata"]["name"][]): Promise<TestApplication> {
    const testApplication = new TestApplication(keepDependencies);
    await testApplication.start();
    return testApplication;
}
