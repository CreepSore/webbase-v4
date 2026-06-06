import IMaybeError from "../../Core.Interfaces/return-types/IMaybeError";
import MaybeError from "../../Core.Interfaces/return-types/MaybeError";
import ICanApplySerializable from "../../Core.Interfaces/seralization/ICanApplySerializable";
import IProducesSerializable from "../../Core.Interfaces/seralization/IProducesSerializable";
import INamedComponent from "../components/INamedComponent";
import IComponent from "../components/interface/IComponent";
import INamedComponentFactory from "../components/interface/INamedComponentFactory";
import ComponentContainer, { ComponentContainerSerializable } from "../container/ComponentContainer";
import ComponentEnvironmentInitializeError from "./ComponentEnvironmentInitializeError";

export type ComponentEnvironmentSerializable = {
    componentContainer: ComponentContainerSerializable;
};

export default class ComponentEnvironment<TComponents extends IComponent> implements IProducesSerializable<ComponentEnvironmentSerializable>, ICanApplySerializable<ComponentEnvironmentSerializable> {
    private _container: ComponentContainer<any> = new ComponentContainer();
    private _components: Map<string, INamedComponent> = new Map();
    private _factories: Map<string, INamedComponentFactory<TComponents>> = new Map();

    registerComponent(component: INamedComponent): this {
        this._components.set(component.id, component);
        return this;
    }

    registerFactory(factory: INamedComponentFactory<TComponents>): this {
        this._factories.set(factory.id, factory);
        return this;
    }

    applySerializable(serialized: ComponentEnvironmentSerializable): IMaybeError<void> {
        for(const [componentId, componentName] of Object.entries(serialized.componentContainer.components)) {
            const component = this._components.get(componentName);
            if(!component) {
                return MaybeError.fromError(new ComponentEnvironmentInitializeError(`Component not found: ${componentName}`));
            }

            this._container.attachComponent(componentId, component);
        }

        for(const [componentId, factoryData] of Object.entries(serialized.componentContainer.componentFactories)) {
            const factory = this._factories.get(factoryData.factoryId);
            if(!factory) {
                return MaybeError.fromError(new ComponentEnvironmentInitializeError(`Factory not found: ${factoryData.factoryId}`));
            }

            this._container.attachComponentFactory(componentId, factory, factoryData.type);
        }

        return MaybeError.void();
    }

    produceSerializable(): ComponentEnvironmentSerializable {
        return {
            componentContainer: this._container.produceSerializable(),
        };
    }
}
