import IComponent from "./interface/IComponent";

export default class ComponentArray<T extends IComponent> extends Array<T> implements IComponent {

}
