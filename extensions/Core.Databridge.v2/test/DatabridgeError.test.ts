import Databridge from "../Databridge";
import DatabridgeLambdaLayer from "../layers/DatabridgeLambdaLayer";
import DatabridgeMultiLayer from "../layers/DatabridgeMultiLayer";

describe("Databridge error test", () => {
    it("should call the error handler", async() => {
        const db = new Databridge(
            new DatabridgeMultiLayer()
                .attachLayer(new DatabridgeLambdaLayer({
                    process: async() => {
                        await db.handleError(new Error("test"), this);
                    }
                })),
                new DatabridgeMultiLayer()
        );

        db.handleError = jest.fn();

        expect(db.handleError).toHaveBeenCalledTimes(0);

        const triggerError = jest.fn(() => db.handleInboundPacket({}));
        await triggerError();

        expect(db.handleError).toHaveBeenCalledTimes(1);
    });
});