import ObjectPool from "../src/service/utils/ObjectPool";

describe("ObjectPool tests", () => {
    it("should create the minimum amount", async() => {
        let index = 0;
        const objectPool = new ObjectPool<number>({
            builder: () => Promise.resolve(++index),
            min: 50,
            max: 50,
        });

        await objectPool.start();

        expect(objectPool.total).toBe(50);
    });

    it("should create more if rented maximum amount not exceeded", async() => {
        let index = 0;
        const objectPool = new ObjectPool<number>({
            builder: () => Promise.resolve(++index),
            min: 50,
            max: 51,
        });

        await objectPool.start();

        expect(objectPool.total).toBe(50);

        for(let i = 0; i < 51; i++) {
            await objectPool.get();
        }

        expect(objectPool.total).toBe(51);
    });

    it("should give privileges to the next one waiting if maximum amount is exceeded after freeing", async() => {
        let index = 0;
        const objectPool = new ObjectPool<number>({
            builder: () => Promise.resolve(++index),
            min: 50,
            max: 50,
        });

        await objectPool.start();

        expect(objectPool.total).toBe(50);

        const rented = [];
        for(let i = 0; i < 50; i++) {
            rented.push(await objectPool.get());
        }

        expect(objectPool.total).toBe(50);

        const waitPromise1 = objectPool.get();
        const waitPromise2 = objectPool.get();
        objectPool.free(rented[0]);

        const rentedInstance = await waitPromise1;
        objectPool.free(rentedInstance);
        await waitPromise2;

        expect(objectPool.total).toBe(50);
    });
});
