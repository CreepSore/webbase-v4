import IComponent from "./IComponent";

export default interface IHasComponents<TComponent extends IComponent> {
    get components(): ReadonlyMap<string, TComponent>;
}
