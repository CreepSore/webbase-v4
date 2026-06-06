import IComponent from "./interface/IComponent";

export default class ComponentSet<T extends IComponent> extends Set<T> implements IComponent {

}
