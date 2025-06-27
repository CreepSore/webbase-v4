import WorkerThread from "../src/logic/threads/WorkerThread";

describe("WorkerThread Tests", () => {
    it("should create a worker thread", async() => {
        const thread = new WorkerThread();
        await thread.start();
        await thread.waitForExit();
    });
});
