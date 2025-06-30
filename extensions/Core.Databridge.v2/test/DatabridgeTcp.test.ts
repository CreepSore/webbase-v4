import Databridge from "../Databridge";
import IDatabridge from "../IDatabridge";
import DatabridgeBufferLayer from "../layers/converters/DatabridgeBufferLayer";
import DatabridgeJsonLayer from "../layers/converters/DatabridgeJsonLayer";
import DatabridgeMultiLayer from "../layers/DatabridgeMultiLayer";
import DatabridgeLambdaLayer from "../layers/misc/DatabridgeLambdaLayer";
import DatabridgeLocalOutboundLayer from "../layers/misc/DatabridgeLocalOutboundLayer";
import DatabridgeTcpClientLayer from "../layers/tcp/DatabridgeTcpClientLayer";
import DatabridgeTcpServerLayer from "../layers/tcp/DatabridgeTcpServerLayer";

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
                .attachInboundLayer(clientLayer)
                .attachInboundLayer(new DatabridgeBufferLayer())
                .attachInboundLayer(new DatabridgeJsonLayer<string, {hello: string}>("deserialize"))
                .attachInboundLayer(new DatabridgeLambdaLayer({
                    processInbound: clientReceivedCallback
                })),
            new DatabridgeMultiLayer()
                .attachOutboundLayer(clientOutbound)
                .attachOutboundLayer(new DatabridgeJsonLayer<any, string>("serialize"))
                .attachOutboundLayer(new DatabridgeBufferLayer())
                .attachOutboundLayer(clientLayer)
        );

        const serverLayer = new DatabridgeTcpServerLayer({port: 9090, bindAddress: "127.0.0.1"});
        db2 = new Databridge(
            new DatabridgeMultiLayer()
                .attachInboundLayer(serverLayer)
                .attachInboundLayer(new DatabridgeBufferLayer())
                .attachInboundLayer(new DatabridgeJsonLayer("deserialize"))
                .attachInboundLayer(new DatabridgeLambdaLayer({
                    processInbound: serverReceivedCallback
                })),
            new DatabridgeMultiLayer()
                .attachOutboundLayer(serverOutbound)
                .attachOutboundLayer(new DatabridgeJsonLayer("serialize"))
                .attachOutboundLayer(new DatabridgeBufferLayer())
                .attachOutboundLayer(serverLayer)
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
