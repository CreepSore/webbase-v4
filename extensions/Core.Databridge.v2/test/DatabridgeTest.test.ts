import Databridge from "../Databridge";
import DatabridgeEchoInboundLayer from "../layers/misc/DatabridgeEchoInboundLayer";
import DatabridgeBufferLayer from "../layers/converters/DatabridgeBufferLayer";
import DatabridgeJsonLayer from "../layers/converters/DatabridgeJsonLayer";
import DatabridgeLocalOutboundLayer from "../layers/misc/DatabridgeLocalOutboundLayer";
import DatabridgeMultiLayer from "../layers/DatabridgeMultiLayer";

describe("Databridge Tests", () => {
    it("should communicate successfully", async() => {
        const payload = {
            test: "hello"
        };

        const packetCallbackFn = jest.fn(packet => {
            expect(typeof(packet)).toBe("object");
            expect(packet).not.toStrictEqual(payload);
            expect(JSON.parse(packet.toString())).toStrictEqual(payload);
        });

        const databridge = new Databridge(
            new DatabridgeMultiLayer()
                .attachInboundLayer(new DatabridgeBufferLayer("utf-8"))
                .attachInboundLayer(new DatabridgeJsonLayer("deserialize"))
                .attachInboundLayer(new DatabridgeEchoInboundLayer()),
            new DatabridgeMultiLayer()
                .attachOutboundLayer(new DatabridgeJsonLayer("serialize"))
                .attachOutboundLayer(new DatabridgeBufferLayer())
                .attachOutboundLayer(new DatabridgeLocalOutboundLayer<Buffer>(packetCallbackFn))
        );

        await databridge.start();
        await databridge.handleInboundPacket(Buffer.from(JSON.stringify(payload)));
        await databridge.stop();

        expect(packetCallbackFn).toHaveBeenCalledTimes(1);
    });
});