import LambdaComponentFactory from "../components/LambdaComponentFactory";
import ComponentContainer from "../container/ComponentContainer";
import ComponentEnvironment from "../environment/ComponentEnvironment";

describe("Core.Components Test", () => {
    const component = {
        get id(): string {
            return "HellO";
        },
        test(): string {
            return "wOrld";
        }
    };

    const factory = new LambdaComponentFactory(() => ({
        get id(): string {
            return "HellO2";
        },
        test(): string {
            return "wOrld2";
        }
    }), () => "HellO2");

    it("should register and retrieve components correctly", () => {
        const container = new ComponentContainer();

        container.attachComponent("A", component);
        container.attachSingletonFactory("B", factory);
        container.attachTransientFactory("C", factory);

        expect(container.components.size).toBe(1);
        expect(container.getComponent("A")).toBe(component);
        expect(container.getComponent("B")).not.toBeNull();
        expect(container.getComponent("C")).not.toBeNull();

        const singletonInstance1 = container.getComponent<ReturnType<typeof factory.create>>("B");
        const singletonInstance2 = container.getComponent<ReturnType<typeof factory.create>>("B");
        expect(singletonInstance1).not.toBeNull();
        expect(singletonInstance2).not.toBeNull();
        expect(singletonInstance1).toBe(singletonInstance2);
        expect(singletonInstance1!.id).toBe("HellO2");
        expect(singletonInstance2!.id).toBe("HellO2");
        expect(singletonInstance1!.test()).toBe("wOrld2");
        expect(singletonInstance2!.test()).toBe("wOrld2");

        const transientInstance1 = container.getComponent<ReturnType<typeof factory.create>>("C");
        const transientInstance2 = container.getComponent<ReturnType<typeof factory.create>>("C");
        expect(transientInstance1).not.toBeNull();
        expect(transientInstance2).not.toBeNull();
        expect(transientInstance1).not.toBe(transientInstance2);
        expect(transientInstance1!.id).toBe("HellO2");
        expect(transientInstance2!.id).toBe("HellO2");
        expect(transientInstance1!.test()).toBe("wOrld2");
        expect(transientInstance2!.test()).toBe("wOrld2");
        expect(transientInstance1).not.toBe(transientInstance2);
    });

    it("should handle environment serialization correctly", () => {
        const environment = new ComponentEnvironment();

        environment.container.attachComponent("A", component);
        environment.container.attachSingletonFactory("B", factory);
        environment.container.attachTransientFactory("C", factory);

        const serialized = environment.produceSerializable();
        expect(serialized).not.toBeNull();

        const deserialized = new ComponentEnvironment();
        deserialized.registerComponent(component);
        deserialized.registerFactory(factory);

        const applyResult = deserialized.applySerializable(serialized);
        expect(applyResult.error).toBeUndefined();
        expect(applyResult.hasError).toBe(false);

        const container = deserialized.container;
        expect(container.components.size).toBe(1);
        expect(container.getComponent("A")).toBe(component);
        expect(container.getComponent("B")).not.toBeNull();
        expect(container.getComponent("C")).not.toBeNull();

        const singletonInstance1 = container.getComponent<ReturnType<typeof factory.create>>("B");
        const singletonInstance2 = container.getComponent<ReturnType<typeof factory.create>>("B");
        expect(singletonInstance1).not.toBeNull();
        expect(singletonInstance2).not.toBeNull();
        expect(singletonInstance1).toBe(singletonInstance2);
        expect(singletonInstance1!.id).toBe("HellO2");
        expect(singletonInstance2!.id).toBe("HellO2");
        expect(singletonInstance1!.test()).toBe("wOrld2");
        expect(singletonInstance2!.test()).toBe("wOrld2");

        const transientInstance1 = container.getComponent<ReturnType<typeof factory.create>>("C");
        const transientInstance2 = container.getComponent<ReturnType<typeof factory.create>>("C");
        expect(transientInstance1).not.toBeNull();
        expect(transientInstance2).not.toBeNull();
        expect(transientInstance1).not.toBe(transientInstance2);
        expect(transientInstance1!.id).toBe("HellO2");
        expect(transientInstance2!.id).toBe("HellO2");
        expect(transientInstance1!.test()).toBe("wOrld2");
        expect(transientInstance2!.test()).toBe("wOrld2");
        expect(transientInstance1).not.toBe(transientInstance2);
    });
});
