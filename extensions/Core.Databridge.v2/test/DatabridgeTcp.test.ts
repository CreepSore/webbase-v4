import Databridge from "../Databridge";
import IDatabridge from "../IDatabridge";
import DatabridgeFromBufferLayer from "../layers/DatabridgeFromBufferLayer";
import DatabridgeJsonLayer from "../layers/DatabridgeJsonLayer";
import DatabridgeLambdaLayer from "../layers/DatabridgeLambdaLayer";
import DatabridgeLocalInboundLayer from "../layers/DatabridgeLocalInboundLayer";
import DatabridgeLocalOutboundLayer from "../layers/DatabridgeLocalOutboundLayer";
import DatabridgeMultiLayer from "../layers/DatabridgeMultiLayer";
import DatabridgeTcpClientLayer from "../layers/DatabridgeTcpClientLayer";
import DatabridgeTcpServerLayer from "../layers/DatabridgeTcpServerLayer";
import DatabridgeToBufferLayer from "../layers/DatabridgeToBufferLayer";

describe("Databridge TCP Tests", () => {
    let db1: IDatabridge;
    let db2: IDatabridge;

    afterEach(async() => {
        await db1.stop();
        await db2.stop();
    });

    it("should establish a communication between two databridges correctly", async() => {
        const clientLayer = new DatabridgeTcpClientLayer({port: 9090, hostname: "127.0.0.1"});
        const payload = {
            hello: "oworld"
        };

        const clientOutbound = new DatabridgeLocalOutboundLayer();
        const serverOutbound = new DatabridgeLocalOutboundLayer();

        const serverReceivedCallback = jest.fn(async(packet: any) => {
            expect(packet).toStrictEqual(payload);
        });

        const clientReceivedCallback = jest.fn(async(packet: any) => {
            expect(packet).toStrictEqual(payload);
        });

        db1 = new Databridge(
            new DatabridgeMultiLayer()
                .attachLayer(clientLayer)
                .attachLayer(new DatabridgeFromBufferLayer())
                .attachLayer(new DatabridgeJsonLayer<string, {hello: string}>("deserialize"))
                .attachLayer(new DatabridgeLambdaLayer({
                    process: clientReceivedCallback
                })),
            new DatabridgeMultiLayer()
                .attachLayer(clientOutbound)
                .attachLayer(new DatabridgeJsonLayer("serialize"))
                .attachLayer(new DatabridgeToBufferLayer())
                .attachLayer(clientLayer)
        );

        const serverLayer = new DatabridgeTcpServerLayer({port: 9090, bindAddress: "127.0.0.1"});
        db2 = new Databridge(
            new DatabridgeMultiLayer()
                .attachLayer(serverLayer)
                .attachLayer(new DatabridgeFromBufferLayer())
                .attachLayer(new DatabridgeJsonLayer("deserialize"))
                .attachLayer(new DatabridgeLambdaLayer({
                    process: serverReceivedCallback
                })),
            new DatabridgeMultiLayer()
                .attachLayer(serverOutbound)
                .attachLayer(new DatabridgeJsonLayer("serialize"))
                .attachLayer(new DatabridgeToBufferLayer())
                .attachLayer(serverLayer)
        );

        await db2.start();
        await db1.start();

        await db1.handleOutboundPacket(payload);
        await db2.handleOutboundPacket(payload);

        await new Promise<void>(res => {
            setTimeout(() => {
                res();
            }, 500);
        });

        expect(serverReceivedCallback).toHaveBeenCalledTimes(1);
        expect(clientReceivedCallback).toHaveBeenCalledTimes(1);
    });
});
