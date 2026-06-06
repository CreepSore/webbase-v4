import IComponent from "./interface/IComponent";
import IComponentFactory from "./interface/IComponentFactory";
import INamedComponentFactory from "./interface/INamedComponentFactory";

export default class LambdaComponentFactory<TComponent extends IComponent> implements INamedComponentFactory<TComponent> {
    private _createCallback: () => TComponent;
    private _idGetter: (() => any) | null = null;

    get id(): any {
        return this._idGetter ? this._idGetter() : null;
    }

    constructor(createCallback: () => TComponent, idGetter: (() => any) | null = null) {
        this._createCallback = createCallback;
        this._idGetter = idGetter;
    }

    create(): TComponent {
        return this._createCallback();
    }
}
