import Core from "../extensions/Core";
import { AnyExecutionContext } from "../src/service/extensions/ExecutionContext";
import ExtensionService from "../src/service/extensions/ExtensionService";
import VirtualExtensionEnvironment from "../src/service/extensions/environments/VirtualExtensionEnvironment";
import LegacyExtensionLoader from "../src/service/extensions/loaders/LegacyExtensionLoader";
import NullExtension from "./NullExtension";

describe("ExtensionService Tests", () => {
    it("Should load legacy extensions correctly", async() => {
        const virtualEnvironment = new VirtualExtensionEnvironment();
        const extensionService = new ExtensionService();
        const legacyLoader = new LegacyExtensionLoader();
        const core = new Core();
        core.start = jest.fn();
        core.stop = jest.fn();

        virtualEnvironment.addExtension(core);

        const context = {
            contextType: "any",
            extensionService,
        } as AnyExecutionContext;
        extensionService.initialize(context)

        // @ts-ignore
        expect(extensionService._executionContext).toBe(context);

        expect(extensionService.getExtensionByConstructor(Core)).toBeFalsy();
        expect(extensionService.getExtensionByName(core.metadata.name)).toBeFalsy();

        await virtualEnvironment.applyTo(extensionService);
        expect(extensionService.getExtensionByConstructor(Core)).toBeTruthy();
        expect(extensionService.getExtensionByName(core.metadata.name)).toBeTruthy();

        extensionService.registerExtensionLoader(legacyLoader);

        await extensionService.loadExtension(core);
        expect(core.start).not.toHaveBeenCalled();
        expect(core.stop).not.toHaveBeenCalled();

        await extensionService.startExtension(core);
        expect(core.start).toHaveBeenCalledTimes(1);
        expect(core.stop).not.toHaveBeenCalled();

        await extensionService.stopExtension(core);
        expect(core.start).toHaveBeenCalledTimes(1);
        expect(core.stop).toHaveBeenCalledTimes(1);

        await extensionService.unloadExtension(core);

        extensionService.unregisterExtension(core);

        expect(extensionService.getExtensionByConstructor(Core)).toBeFalsy();
        expect(extensionService.getExtensionByName(core.metadata.name)).toBeFalsy();
        expect(core.start).toHaveBeenCalledTimes(1);
        expect(core.stop).toHaveBeenCalledTimes(1);
    });

    it("Should iterate extensions in the correct order", () => {
        const virtualEnvironment = new VirtualExtensionEnvironment();
        const extensionService = new ExtensionService();

        const extensions = [
            new NullExtension({
                name: "E1.1",
                dependencies: [],
                version: "0.0.0",
            }),
            new NullExtension({
                name: "E1.2",
                dependencies: [],
                version: "0.0.0",
            }),
            new NullExtension({
                name: "E2.1",
                dependencies: ["E1.1"],
                version: "0.0.0",
            }),
            new NullExtension({
                name: "E2.2",
                dependencies: ["E1.1", "E1.2"],
                version: "0.0.0",
            }),
            new NullExtension({
                name: "E3",
                dependencies: ["E1.1", "E2.2"],
                version: "0.0.0",
            }),
        ] as const;

        const reversed = [...extensions].reverse();

        for(const extension of reversed) {
            virtualEnvironment.addExtension(extension);
        }

        virtualEnvironment.applyTo(extensionService);

        let namePrefix = 1;
        let iterated = 0;
        for(const extension of extensionService.iterateExtensions()) {
            const currentPrefix = Number(extension.metadata.name.substring(1, 2));

            if(currentPrefix < namePrefix) {
                fail();
            }
            else if(currentPrefix > namePrefix + 1) {
                fail();
            }

            iterated++;
            namePrefix = currentPrefix
        }

        expect(iterated).toBe(extensions.length);
    });
});

describe("ExtensionService Error Tests", () => {
    it("Should throw when trying to register the same extension multiple times", () => {
        const extensionService = new ExtensionService();

        const extension1 = new NullExtension({
            name: "E1",
            dependencies: [],
            version: "0.0.0",
        });

        const extension2 = new NullExtension({
            name: "E1",
            dependencies: [],
            version: "0.0.0",
        });

        extensionService.registerExtension(extension1);

        // Same instance
        expect(() => extensionService.registerExtension(extension1)).toThrow();

        // Same name
        expect(() => extensionService.registerExtension(extension2)).toThrow();
    });

    it("Should throw when trying to do lifecycle-based actions on extensions without a registered loader", async() => {
        const virtualEnvironment = new VirtualExtensionEnvironment([
            new NullExtension({name: "E1", dependencies: [], version: "0.0.0"}, jest.fn(), jest.fn()),
        ]);
        const extensions = [...virtualEnvironment.extensions.values()];

        const extensionService = new ExtensionService();

        await virtualEnvironment.applyTo(extensionService);

        extensionService.initialize({
            contextType: "any",
            extensionService,
        })

        await expect(extensionService.loadExtensions()).rejects.toThrow();
        await expect(extensionService.startExtensions(false)).rejects.toThrow();
        await expect(extensionService.stopExtensions()).rejects.toThrow();
        await expect(extensionService.unloadExtensions()).rejects.toThrow();

        await expect(extensionService.loadExtension(extensions[0])).rejects.toThrow();
        await expect(extensionService.startExtension(extensions[0])).rejects.toThrow();
        await expect(extensionService.stopExtension(extensions[0])).rejects.toThrow();
        await expect(extensionService.unloadExtension(extensions[0])).rejects.toThrow();
    });
});
