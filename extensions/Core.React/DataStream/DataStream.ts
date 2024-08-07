type DataStreamOnReceiveCallback<KeyType extends string = any, ValueType = any> = (data: IDataStreamData<KeyType, ValueType>) => void;
type DataStreamOnReceiveTypeCallback<KeyType extends string = any, ValueType = any> = (data: ValueType, raw: IDataStreamData<KeyType, ValueType>) => void;

export type {
    DataStreamOnReceiveCallback,
    DataStreamOnReceiveTypeCallback,
};

export interface IDataStreamData<KeyType extends string = any, ValueType = any> {
    type: KeyType;
    data: ValueType;
}

export default class DataStream {
    private events: Map<string, Array<DataStreamOnReceiveTypeCallback<any, any>|DataStreamOnReceiveCallback<any, any>>> = new Map();
    private validTypes: string[] = [];

    constructor() {
        this.events.set("receive", []);
    }

    send<ValueType = any>(type: string, data: ValueType): void {
        this.events.get("receive").forEach(cb => {
            (cb as DataStreamOnReceiveCallback)?.({type, data});
        });

        [...this.validTypes].forEach(e => {
            (this.events.get(`receive-type-${e}`) || []).forEach(callback => {
                (callback as DataStreamOnReceiveTypeCallback)?.(data, {type, data});
            });
        });
    }

    receive<ValueType = any>(callback: DataStreamOnReceiveCallback<any, ValueType>): void {
        this.events.get("receive").push(callback);
    }

    removeReceiveListener(callback: DataStreamOnReceiveCallback<any, any>): void {
        this.events.set("receive", this.events.get("receive").filter(e => e !== callback));
    }

    receiveType<KeyType extends string, ValueType = any>(type: KeyType, callback: DataStreamOnReceiveTypeCallback<KeyType, ValueType>): void {
        if(!this.events.has(`receive-type-${type}`)) {
            this.events.set(`receive-type-${type}`, []);
            this.validTypes.push(type);
        }

        this.events.get(`receive-type-${type}`).push(callback);
    }

    removeReceiveTypeListener(type: KeyType, callback: DataStreamOnReceiveTypeCallback<any, any>): void {
        if(!this.events.has(`receive-type-${type}`)) {
            return;
        }

        this.events.set(`receive-type-${type}`, this.events.get(`receive-type-${type}`).filter(e => e !== callback));
    }
}
