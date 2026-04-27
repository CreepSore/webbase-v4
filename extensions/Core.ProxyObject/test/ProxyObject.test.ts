import BasicIo from "../../../src/logic/io/BasicIo";
import MockInboundChannel from "../../../src/logic/io/channels/inbound/MockInboundChannel";
import MockOutboundChannel from "../../../src/logic/io/channels/outbound/MockOutboundChannel";
import BasicMessageFactory from "../../../src/logic/io/messages/BasicMessageFactory";
import ProxyBuilder from "../ProxyBuilder";
import TestObjectPlayer from "./TestObjectPlayer";

describe("Proxy Object tests", () => {
    test("Basic property test", async() => {
        const playerIn = new TestObjectPlayer("OwO");
        const playerOut = new TestObjectPlayer("");
        const ioIn = new BasicIo(new BasicMessageFactory());
        const ioInIn = new MockInboundChannel();
        const ioInOut = new MockOutboundChannel();

        const ioOut = new BasicIo(new BasicMessageFactory());
        const ioOutIn = new MockInboundChannel();
        const ioOutOut = new MockOutboundChannel();

        ioInOut.setCallback(payload => ioOutIn.handleMessage(payload));
        ioOutOut.setCallback(payload => ioInIn.handleMessage(payload));

        ioIn.channelRegistrate.registerInboundChannel(ioInIn);
        ioIn.channelRegistrate.registerOutboundChannel(ioInOut);

        ioOut.channelRegistrate.registerInboundChannel(ioOutIn);
        ioOut.channelRegistrate.registerOutboundChannel(ioOutOut);
        await ioIn.start();
        await ioOut.start();

        const receiverProxy = new ProxyBuilder(playerIn, ioIn)
            .asReceiver();

        receiverProxy.start();

        const senderProxy = new ProxyBuilder(playerOut, ioOut)
            .asSender();

        expect(await senderProxy.getHealth()).toBe(100);
        await senderProxy.damage(30);
        expect(await senderProxy.getHealth()).toBe(70);
        expect(playerIn.getHealth()).toBe(70);
        expect(await senderProxy.name).toBe(playerIn.name);

        await ioIn.stop();
        await ioOut.stop();
    });
});
