import Databridge from "../Databridge";
import DatabridgeEchoInboundLayer from "../layers/DatabridgeEchoInboundLayer";
import DatabridgeFromBufferLayer from "../layers/DatabridgeFromBufferLayer";
import DatabridgeJsonLayer from "../layers/DatabridgeJsonLayer";
import DatabridgeLocalInboundLayer from "../layers/DatabridgeLocalInboundLayer";
import DatabridgeLocalOutboundLayer from "../layers/DatabridgeLocalOutboundLayer";
import DatabridgeMultiLayer from "../layers/DatabridgeMultiLayer";
import DatabridgeToBufferLayer from "../layers/DatabridgeToBufferLayer";

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
                .attachLayer(new DatabridgeFromBufferLayer("utf-8"))
                .attachLayer(new DatabridgeJsonLayer("deserialize"))
                .attachLayer(new DatabridgeEchoInboundLayer()),
            new DatabridgeMultiLayer()
                .attachLayer(new DatabridgeJsonLayer("serialize"))
                .attachLayer(new DatabridgeToBufferLayer())
                .attachLayer(new DatabridgeLocalOutboundLayer<Buffer>(packetCallbackFn))
        );

        await databridge.start();
        await databridge.handleInboundPacket(Buffer.from(JSON.stringify(payload)));
        await databridge.stop();

        expect(packetCallbackFn).toHaveBeenCalledTimes(1);
    });
});