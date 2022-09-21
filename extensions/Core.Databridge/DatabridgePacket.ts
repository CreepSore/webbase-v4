import * as uuid from "uuid";
import IDatabridgePacket from "./IDatabridgePacket";

export default class DatabridgePacket<T, T2 = any> implements IDatabridgePacket<T, T2> {
    id: string;
    time: number;
    type: string;
    data: T;
    metadata: T2;

    constructor(type: string, data: T, metadata: T2, id: string | null = null, time: number | null = null) {
        this.id = id ?? uuid.v4();
        this.time = time ?? Date.now();
        this.type = type;
        this.data = data;
        this.metadata = metadata;
    }
}
