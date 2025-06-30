import IDatabridgeLayer from "./IDatabridgeLayer";

export default class DatabridgeToBufferLayer implements IDatabridgeLayer<string, Buffer> {
    process(data: string): Promise<Buffer> {
        return Promise.resolve(Buffer.from(data));
    }
}
