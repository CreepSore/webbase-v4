import DatabridgeBuilder from "../DatabridgeBuilder";
import DatabridgeMultiLayer from "../layers/DatabridgeMultiLayer";
import DatabridgeChoiceLayer from "../layers/misc/DatabridgeChoiceLayer";
import DatabridgeLambdaLayer from "../layers/misc/DatabridgeLambdaLayer";
import DatabridgePartyClientLayer from "../layers/party/DatabridgePartyLayer";
import DatabridgePartyPacket from "../layers/party/DatabridgePartyPacket";

describe("DatabridgeParty Test", () => {
    it("should handle parties correctly", async() => {
        const myParty = "party1";
        const targetParty = "party2";
        /*
                .attachInboundLayer(new DatabridgeLambdaLayer({
                    processInbound: (data, metadata) => {
                        if(metadata.partyLayer.fromParty !== targetParty) {
                            throw new Error("Invalid party");
                        }
                        return data.hello;
                    }
                }))
*/


        const db1 = new DatabridgeBuilder()
            .setInboundLayer(
                new DatabridgeMultiLayer<DatabridgePartyPacket<{hello: string}>>()
                    .attachInboundLayer(new DatabridgePartyClientLayer(myParty, targetParty))
                    .attachInboundLayer(new DatabridgeChoiceLayer()),
            ).setOutboundLayer(new DatabridgeLambdaLayer())
            .finish();

        await db1.start();

        await db1.handleInboundPacket({
            id: "1",
            fromParty: targetParty,
            toParty: myParty,
            payload: {
                hello: "test",
            },
        });
    });
});
