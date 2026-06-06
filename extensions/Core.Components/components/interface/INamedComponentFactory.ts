import IWithIdentifier from "../../../Core.Interfaces/identification/IWithIdentifier";
import IComponent from "./IComponent";
import IComponentFactory from "./IComponentFactory";

export default interface INamedComponentFactory<TComponent extends IComponent> extends IComponentFactory<TComponent>, IWithIdentifier<any> {

}
