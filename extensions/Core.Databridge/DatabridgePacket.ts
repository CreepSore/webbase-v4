import * as uuid from "uuid";
import IDatabridgePacket from "./IDatabridgePacket";

export default class DatabridgePacket<DataType, MetadataType = any> implements IDatabridgePacket<DataType, MetadataType> {
    id: string;
    time: number;
    type: string;
    data: DataType;
    metadata: MetadataType;

    constructor(type: string, data: DataType, metadata: MetadataType, id: string | null = null, time: number | null = null) {
        this.id = id ?? uuid.v4();
        this.time = time ?? Date.now();
        this.type = type;
        this.data = data;
        this.metadata = metadata;
    }
}
