export type FilterLayer<T> = {
    $and?: FilterLayer<T>[];
    $or?: FilterLayer<T>[];
    $not?: FilterLayer<T>[];
    $equal?: { key: keyof T; value: any };
    $greaterThan?: { key: keyof T; value: any };
    $greaterThanOrEqual?: { key: keyof T; value: any };
    $lessThan?: { key: keyof T; value: any };
    $lessThanOrEqual?: { key: keyof T; value: any };
};

export type BeginLayerCallback<T> = (layer: FilterLayer<T>) => void;
export type EndLayerCallback<T> = (layer: FilterLayer<T>) => void;
export type IterateLayerCallback<T> = (layer: FilterLayer<T>, key: keyof T, value: any) => void;


export default class FilterLayerIterator<T> {
    private _layer: FilterLayer<T>;

    constructor(layer: FilterLayer<T>) {
        this._layer = layer;
    }

    iterate(
        iterateCallback: IterateLayerCallback<T>,
        beginLayerCallback?: BeginLayerCallback<T>,
        endLayerCallback?: EndLayerCallback<T>
    ) {
        if (beginLayerCallback) {
            beginLayerCallback(this._layer);
        }

        const children = this._layer.$and || this._layer.$or || this._layer.$not;
        const kvp = this._layer.$equal || this._layer.$greaterThan || this._layer.$greaterThanOrEqual || this._layer.$lessThan || this._layer.$lessThanOrEqual;

        if (children) {
            for (const child of children) {
                const childIterator = new FilterLayerIterator<T>(child);
                childIterator.iterate(iterateCallback, beginLayerCallback, endLayerCallback);
            }
        }
        else if (kvp) {
            iterateCallback(this._layer, kvp.key, kvp.value);
        }

        if (endLayerCallback) {
            endLayerCallback(this._layer);
        }
    }
}
