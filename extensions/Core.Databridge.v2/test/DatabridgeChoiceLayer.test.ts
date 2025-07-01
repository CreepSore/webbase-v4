import Databridge from "../Databridge";
import DatabridgeChoiceLayer from "../layers/misc/DatabridgeChoiceLayer";
import DatabridgeLambdaLayer from "../layers/misc/DatabridgeLambdaLayer";

describe("DatabridgeChoiceLayer test", () => {
    it("should process using chosen layers correctly", async() => {
        let current = 0;

        const fn0 = jest.fn();
        const fn1 = jest.fn();
        const fn2 = jest.fn();

        const db = new Databridge(
            new DatabridgeChoiceLayer<number, string>({
                chooseLayerInbound: (d) => String(d)
            }).registerInboundLayer("0", new DatabridgeLambdaLayer({
                processInbound: fn0
            })).registerInboundLayer("1", new DatabridgeLambdaLayer({
                processInbound: fn1
            })).registerInboundLayer("2", new DatabridgeLambdaLayer({
                processInbound: fn2
            })),
            new DatabridgeLambdaLayer({})
        );

        await db.start();

        expect(fn0).toHaveBeenCalledTimes(0);
        expect(fn1).toHaveBeenCalledTimes(0);
        expect(fn2).toHaveBeenCalledTimes(0);

        await db.handleInboundPacket(0);

        expect(fn0).toHaveBeenCalledTimes(1);
        expect(fn1).toHaveBeenCalledTimes(0);
        expect(fn2).toHaveBeenCalledTimes(0);

        await db.handleInboundPacket(1);

        expect(fn0).toHaveBeenCalledTimes(1);
        expect(fn1).toHaveBeenCalledTimes(1);
        expect(fn2).toHaveBeenCalledTimes(0);

        await db.handleInboundPacket(2);

        expect(fn0).toHaveBeenCalledTimes(1);
        expect(fn1).toHaveBeenCalledTimes(1);
        expect(fn2).toHaveBeenCalledTimes(1);

        await db.stop();
    });
});
