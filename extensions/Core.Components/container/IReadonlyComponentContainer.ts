import IComponent from "../components/interface/IComponent";
import IHasComponents from "../components/interface/IHasComponents";

export default interface IReadonlyComponentContainer<TComponents extends IComponent> extends IHasComponents<TComponents> {
    getComponent<TComponent extends TComponents>(id: string): TComponent | null;
}
