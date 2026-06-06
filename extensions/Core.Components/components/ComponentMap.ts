import IComponent from "./interface/IComponent";

export default class ComponentMap<K, V extends IComponent> extends Map<K, V> implements IComponent {

}
