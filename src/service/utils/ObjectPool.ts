export type ObjectPoolOptions<T> = {
    builder: () => Promise<T>;
    destructor?: (instance: T) => Promise<void>;

    max: number;
    min?: number;
}

export default class ObjectPool<T> {
    private _options: ObjectPoolOptions<T>;

    private _isStarted: boolean;

    private _free: Set<T> = new Set();
    private _used: Set<T> = new Set();
    private _waitingGets: Array<(instance: T) => void> = [];

    get total() {
        return this._free.size + this._used.size;
    }

    constructor(options: ObjectPoolOptions<T>) {
        this._options = options;
    }

    async start() {
        if(this._isStarted) {
            return;
        }

        this._isStarted = true;

        await this.ensureMinimum();
    }

    stop() {
        if(!this._isStarted) {
            return;
        }

        this._isStarted = false;

        if(this._options.destructor) {
            const toAwait = [];

            for(const instance of [...this._used]) {
                toAwait.push(this._options.destructor(instance));
            }

            for(const instance of [...this._free]) {
                toAwait.push(this._options.destructor(instance));
            }

            return Promise.all(toAwait);
        }

        return Promise.resolve();
    }

    async get(): Promise<T> {
        await this.ensureMinimum();

        let instance: T = this._free.values().next().value;

        if(!instance) {
            if(this._free.size === 0 && this._used.size >= this._options.max) {
                return new Promise<T>(res => {
                    this._waitingGets.push((instance) => {
                        res(instance);
                    });
                });
            }

            instance = await this._options.builder();
        }

        this._free.delete(instance);
        this._used.add(instance);

        return instance;
    }

    free(instance: T): this {
        if(!this._used.has(instance)) {
            return this;
        }

        if(this._waitingGets.length > 0) {
            const instanceFreeCallback = this._waitingGets.shift();
            if(instanceFreeCallback !== undefined) {
                instanceFreeCallback(instance);
                return;
            }
        }

        this._used.delete(instance);
        this._free.add(instance);
        return this;
    }

    private async ensureMinimum(): Promise<void> {
        const toCreate = this._options.min - this.total;
        for(let i = 0; i < toCreate; i++) {
            this._free.add(await this._options.builder());
        }
    }
}
