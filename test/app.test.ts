import { createMainApplication } from "./prepare";
import TestExtension from "./TestExtension";
import TestUtils from "./TestUtils";

describe("app test", () => {
    it("should exit gracefully", async() => {
        const mainApplication = await createMainApplication();
        const testExtension = new TestExtension();

        const startMock = jest.fn();
        const stopMock = jest.fn();

        testExtension.testInitialize({
            start: startMock,
            stop: stopMock
        });

        mainApplication.extensionService.registerExtension(testExtension);

        await TestUtils.timedAwait(mainApplication.start(), 500);
        await TestUtils.timedAwait(mainApplication.start(), 500);

        expect(startMock).toHaveBeenCalledTimes(1);
        expect(stopMock).toHaveBeenCalledTimes(0);

        await TestUtils.timedAwait(mainApplication.stop(), 500);
        await TestUtils.timedAwait(mainApplication.stop(), 500);

        expect(startMock).toHaveBeenCalledTimes(1);
        expect(stopMock).toHaveBeenCalledTimes(1);
    }, 5000);
});