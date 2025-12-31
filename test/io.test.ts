import BasicIo from "../src/logic/io/BasicIo";
import EchoChannel from "../src/logic/io/channels/duplex/EchoChannel";
import BasicMessageFactory from "../src/logic/io/messages/BasicMessageFactory";
import IIncomingMessage from "../src/logic/io/messages/IIncomingMessage";

describe("BasicIO Tests", () => {
    it("should send and receive messages correctly using a mock channel", async() => {
        const testString = "Hello World!!";

        const receiveFn = jest.fn((message: IIncomingMessage<Buffer>) => {
            expect(message.payload.toString()).toBe(testString);
        });

        const io1 = new BasicIo(new BasicMessageFactory());
        io1.registerDuplexChannel(new EchoChannel());

        io1.onMessageReceived(message => receiveFn(message));

        await io1.start();
        await io1.messageFactory.buildOutgoingMessage(testString).send();

        expect(receiveFn).toHaveBeenCalledTimes(1);

        await io1.stop();
    });

    it("should handle receiveMessage correctly", async() => {
        const testString = "Hello World!!";

        const io1 = new BasicIo(new BasicMessageFactory());
        io1.registerDuplexChannel(new EchoChannel());

        await io1.start();
        const receivePromise = io1.receiveMessage();

        await io1.messageFactory.buildOutgoingMessage(testString).send();
        const message = await receivePromise;

        expect(message.payload.toString()).toBe(testString);

        await io1.stop();
    });
});
