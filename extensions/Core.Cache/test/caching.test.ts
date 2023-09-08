import TestApplication from "@app/TestApplication";
import CoreCache from "..";
import prepareTestApplication from "../../../test/prepare";

describe("caching tests", () => {
    let app: TestApplication;

    beforeAll(async() => {
        app = await prepareTestApplication([CoreCache.metadata.name]);
    });

    afterAll(async() => {
        app.stop();
    });

    it("should cache successfully", async() => {
        const coreCache = app.extensionService.getExtension(CoreCache) as CoreCache;

        const entry = coreCache.createCacheEntry({
            key: "test",
            defaultValue: "ASDF",
            updateCallback: () => {
                return "FDSA";
            },
            updateEveryMs: -1
        })

        expect(entry.currentValue).toBe("ASDF");
        expect(await entry.getValue()).toBe("ASDF");

        await entry.invalidate();

        expect(await entry.getValue()).toBe("FDSA");
    });

    it("should refresh the value automatically", async() => {
        jest.useFakeTimers();
        const coreCache = app.extensionService.getExtension(CoreCache) as CoreCache;

        const entry = coreCache.createCacheEntry({
            key: "test",
            defaultValue: "ASDF",
            updateCallback: () => {
                return "FDSA";
            },
            updateEveryMs: 200
        })

        expect(entry.currentValue).toBe("ASDF");
        expect(await entry.getValue()).toBe("ASDF");

        const timeoutCheck = jest.fn();

        setTimeout(() => {
            timeoutCheck();
            entry.getValue().then(value => expect(value).toBe("FDSA"))
        }, 9999);

        jest.runAllTimers();
        expect(timeoutCheck).toBeCalled();
    });
 });