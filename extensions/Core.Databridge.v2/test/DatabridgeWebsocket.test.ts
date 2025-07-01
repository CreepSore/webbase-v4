import express from "express";
import expressWs from "express-ws";
import DatabridgeBuilder from "../DatabridgeBuilder";
import DatabridgeMultiLayer from "../layers/DatabridgeMultiLayer";
import DatabridgeJsonLayer from "../layers/converters/DatabridgeJsonLayer";
import DatabridgeWebsocketLayer from "../layers/web/DatabridgeWebsocketLayer";
import DatabridgeLambdaLayer from "../layers/misc/DatabridgeLambdaLayer";
import TestUtils from "../../../test/TestUtils";

describe("DatabridgeWebsocket Test", () => {
    let eapp = express();
    let app = expressWs(eapp).app;
    let server = app.listen(9091, "127.0.0.1");

    afterAll(() => {
        server.close();
        server.closeAllConnections();
    });

    it("should establish a connection successfully", async () => {
        const testPacket = { hello: "world" };
        const testPacket2 = { hello: "world2" };

        let openFn: jest.Mock<any>;
        let messageFn: jest.Mock<any>;

        app.ws("/test/ws", (ws) => {
            (openFn = jest.fn(() => {
                ws.send(JSON.stringify(testPacket));
            }))();

            messageFn = jest.fn((msg) => {
                const packet = JSON.parse(msg.toString());
                expect(packet).toStrictEqual(testPacket2);
            })

            ws.on("message", messageFn);
        });

        const receiveFn = jest.fn(async (packet: any) => {
            expect(packet).toStrictEqual(testPacket);
        });

        const websocketLayer = new DatabridgeWebsocketLayer("ws://localhost:9091/test/ws");

        const db = new DatabridgeBuilder()
            .setInboundLayer(
                new DatabridgeMultiLayer<string>()
                    .attachInboundLayer(websocketLayer)
                    .attachInboundLayer(new DatabridgeJsonLayer("deserialize"))
                    .attachInboundLayer(new DatabridgeLambdaLayer({
                        processInbound: receiveFn
                    }))
            ).setOutboundLayer(
                new DatabridgeMultiLayer<any>()
                    .attachOutboundLayer(new DatabridgeJsonLayer("serialize"))
                    .attachOutboundLayer(websocketLayer)
            ).finish();

        await db.start();

        expect(openFn).toHaveBeenCalledTimes(1);
        expect(await TestUtils.waitUntil(() => receiveFn.mock.results.length === 1, 2500)).toBeTruthy();

        await db.handleOutboundPacket(testPacket2);

        expect(await TestUtils.waitUntil(() => messageFn.mock.results.length === 1, 2500)).toBeTruthy();
        await db.stop();
    }, 10000);
});
