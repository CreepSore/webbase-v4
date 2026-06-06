import { ComponentFactoryType } from "../components/ComponentFactoryType";
import IComponent from "../components/interface/IComponent";
import IComponentFactory from "../components/interface/IComponentFactory";
import IComponentContainer from "./IComponentContainer";

export default class ComponentContainer<TComponents extends IComponent> implements IComponentContainer<TComponents> {
    private _components: Map<string, TComponents> = new Map();
    private _componentFactories: Map<string, IComponentFactory<TComponents>> = new Map();
    private _componentFactoryTypes: Map<string, ComponentFactoryType> = new Map();

    get components(): ReadonlyMap<string, TComponents> {
        return this._components;
    }

    attachComponent<TComponent extends TComponents>(id: string, component: TComponent): IComponentContainer<TComponents> {
        this._components.set(id, component);
        return this;
    }

    detachComponent(id: string): IComponentContainer<TComponents> {
        this._components.delete(id);
        return this;
    }

    getComponent<TComponent extends TComponents>(id: string): TComponent | null {
        return this._getComponent(id);
    }

    attachTransientFactory<TComponent extends TComponents>(id: string, factory: IComponentFactory<TComponent>): IComponentContainer<TComponents> {
        return this.attachComponentFactory(id, factory, ComponentFactoryType.TRANSIENT);
    }

    attachSingletonFactory<TComponent extends TComponents>(id: string, factory: IComponentFactory<TComponent>): IComponentContainer<TComponents> {
        return this.attachComponentFactory(id, factory, ComponentFactoryType.SINGLETON);
    }

    attachComponentFactory<TComponent extends TComponents>(
        id: string,
        factory: IComponentFactory<TComponent>,
        type: ComponentFactoryType
    ): IComponentContainer<TComponents> {
        this._componentFactories.set(id, factory);
        this._componentFactoryTypes.set(id, type);
        return this;
    }

    detachComponentFactory(id: string): IComponentContainer<TComponents> {
        this._componentFactories.delete(id);
        this._componentFactoryTypes.delete(id);
        return this;
    }

    private _getComponent<TComponent extends TComponents>(id: string): TComponent | null {
        let instance = this._components.get(id) as TComponent;
        if(instance) {
            return instance;
        }

        const factory = this._componentFactories.get(id);
        const type = this._componentFactoryTypes.get(id);

        if(!factory || !type) {
            return null;
        }

        instance = factory.create() as TComponent;

        switch(type) {
            case ComponentFactoryType.SINGLETON:
                this._components.set(id, instance);
                break;

            case ComponentFactoryType.TRANSIENT:
            default:
                break;
        }

        return instance;
    }
}
