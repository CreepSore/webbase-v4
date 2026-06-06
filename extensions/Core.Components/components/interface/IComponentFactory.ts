import IComponent from "./IComponent";

export default interface IComponentFactory<TComponent extends IComponent> {
    create(): TComponent;
}
