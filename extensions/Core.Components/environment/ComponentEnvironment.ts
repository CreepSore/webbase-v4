import IMaybeError from "../../Core.Interfaces/return-types/IMaybeError";
import MaybeError from "../../Core.Interfaces/return-types/MaybeError";
import ICanApplySerializable from "../../Core.Interfaces/seralization/ICanApplySerializable";
import IProducesSerializable from "../../Core.Interfaces/seralization/IProducesSerializable";
import INamedComponent from "../components/INamedComponent";
import IComponent from "../components/interface/IComponent";
import INamedComponentFactory from "../components/interface/INamedComponentFactory";
import ISerializableComponent from "../components/interface/ISerializableComponent";
import ComponentContainer, { ComponentContainerSerializable } from "../container/ComponentContainer";
import ComponentEnvironmentInitializeError from "./ComponentEnvironmentInitializeError";

export type ComponentEnvironmentSerializable = {
    componentContainer: ComponentContainerSerializable;
};

export default class ComponentEnvironment<TComponents extends IComponent> implements IProducesSerializable<ComponentEnvironmentSerializable>, ICanApplySerializable<ComponentEnvironmentSerializable> {
    private _container: ComponentContainer<TComponents> = new ComponentContainer();
    private _components: Map<string, INamedComponent> = new Map();
    private _factories: Map<string, INamedComponentFactory<TComponents>> = new Map();

    get container(): ComponentContainer<TComponents> {
        return this._container;
    }

    registerComponent<TComponent extends INamedComponent>(component: TComponent): this {
        this._components.set(component.id, component);
        return this;
    }

    registerFactory<TFactory extends INamedComponentFactory<TComponents>>(factory: TFactory): this {
        if(!factory.id) {
            return this;
        }

        this._factories.set(factory.id, factory);
        return this;
    }

    applySerializable(serialized: ComponentEnvironmentSerializable): IMaybeError<void> {
        for(const [componentId, serializedData] of Object.entries(serialized.componentContainer.serializedComponents)) {
            this._container.defineSerializableData(componentId, serializedData);
        }

        for(const [componentId, factoryData] of Object.entries(serialized.componentContainer.componentFactories)) {
            const factory = this._factories.get(factoryData.factoryId);
            if(!factory) {
                return MaybeError.fromError(new ComponentEnvironmentInitializeError(`Factory not found: ${factoryData.factoryId}`));
            }

            this._container.attachComponentFactory(componentId, factory, factoryData.type);
        }

        for(const [componentId, componentName] of Object.entries(serialized.componentContainer.components)) {
            if(this.container.factories.has(componentId)) {
                continue;
            }

            const component = this._components.get(componentName);
            if(!component) {
                return MaybeError.fromError(new ComponentEnvironmentInitializeError(`Component not found: ${componentName}`));
            }

            const serializedData = serialized.componentContainer.serializedComponents[componentId];
            const componentAsSerializable = component as Partial<ISerializableComponent<any>>;
            if(serializedData && componentAsSerializable.applySerializable) {
                componentAsSerializable.applySerializable(serializedData);
            }

            this._container.attachComponent(componentId, component as any as TComponents);
        }

        return MaybeError.void();
    }

    produceSerializable(): ComponentEnvironmentSerializable {
        return {
            componentContainer: this._container.produceSerializable(),
        };
    }
}
