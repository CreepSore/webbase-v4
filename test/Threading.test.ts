import * as workerThreads from "node:worker_threads";
import WorkerApplication from "../src/application/WorkerApplication";
import ThreadMockChannel from "../src/logic/threads/channels/ThreadMockChannel";
import OutgoingThreadMessage from "../src/logic/threads/messages/OutgoingThreadMessage";
import ThreadMessageFactory from "../src/logic/threads/messages/ThreadMessageFactory";
import IncomingThreadMessage from "../src/logic/threads/messages/IncomingThreadMessage";
import ExtensionControlPayload from "../src/logic/threads/message-payload-types/ExtensionControlPayload";
import ThreadIO from "../src/logic/threads/io/ThreadIO";

describe("Multithreading Test", () => {
    it("should communicate successfully using the full WorkerApplication", async() => {
        const workerApp = new WorkerApplication();
        const mockChannel = new ThreadMockChannel();

        let receivedTelegrams = [

        ] as unknown as [ReturnType<ThreadMessageFactory["buildReadyTelegram"]>, ReturnType<ThreadMessageFactory["buildResponseTelegram"]>];

        mockChannel.mockOnMessageSent = jest.fn((message) => {
            receivedTelegrams.push(message);
        });

        await workerApp.start(mockChannel);


        mockChannel.mockReceiveMessage(new IncomingThreadMessage<ExtensionControlPayload>("1", "ExtensionControl", {extensionName: "Core", action: "loadAndStart"}));

        await new Promise(process.nextTick);
        expect(receivedTelegrams.length).toBe(2);
        expect(receivedTelegrams[0]).not.toBeNull();
        expect(receivedTelegrams[0].type).toBe("READY");

        expect(receivedTelegrams[1]).not.toBeNull();
        expect(receivedTelegrams[1].type).toBe("RESPONSE");
    });

    it("should communicate successfully using ThreadIO only", async() => {
        const mockChannel1 = new ThreadMockChannel();
        const io1 = new ThreadIO(mockChannel1);
        const mockChannel2 = new ThreadMockChannel();
        const io2 = new ThreadIO(mockChannel2);

        mockChannel1.mockOnMessageSent = message => mockChannel2.mockReceiveMessage(message);
        mockChannel2.mockOnMessageSent = message => mockChannel1.mockReceiveMessage(message);

        io1.start();
        io2.start();

        const receiveMessagePromise = io2.receiveMessage("TEST");
        const testMessage1 = io1.messageFactory.buildOutgoing("TEST", {});
        io1.sendMessage(testMessage1);

        let receiveResult: IncomingThreadMessage<any> = await Promise.race([receiveMessagePromise, new Promise<any>(res => setTimeout(() => res(null), 100))]);
        expect(receiveResult).not.toBeNull();
        expect(receiveResult.type).toBe("TEST");

        const receiveResponseMessagePromise = testMessage1.waitForResponse();
        receiveResult.respond({test: "TEST"});

        const responseResult = await Promise.race([receiveResponseMessagePromise, new Promise<any>(res => setTimeout(() => res(null), 100))]);
        expect(responseResult).not.toBeNull();
        expect(responseResult.test).toBe("TEST");
    });
});