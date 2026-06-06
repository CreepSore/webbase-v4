import { ComponentFactoryType } from "../components/ComponentFactoryType";
import IComponent from "../components/interface/IComponent";
import IComponentFactory from "../components/interface/IComponentFactory";
import IReadonlyComponentContainer from "./IReadonlyComponentContainer";

export default interface IComponentContainer<TComponents extends IComponent> extends IReadonlyComponentContainer<TComponents> {
    attachComponentFactory<TComponent extends TComponents>(id: string, factory: IComponentFactory<TComponent>, type: ComponentFactoryType): IComponentContainer<TComponents>;
    detachComponentFactory(id: string): IComponentContainer<TComponents>;

    attachComponent<TComponent extends TComponents>(id: string, component: TComponent): IComponentContainer<TComponents>;
    detachComponent(id: string): IComponentContainer<TComponents>;
}
