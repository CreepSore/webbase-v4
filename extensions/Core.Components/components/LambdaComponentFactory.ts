import IComponent from "./interface/IComponent";
import IComponentFactory from "./interface/IComponentFactory";

export default class LambdaComponentFactory<TComponent extends IComponent> implements IComponentFactory<TComponent> {
    private _createCallback: () => TComponent;

    constructor(createCallback: () => TComponent) {
        this._createCallback = createCallback;
    }

    create(): TComponent {
        return this._createCallback();
    }
}
