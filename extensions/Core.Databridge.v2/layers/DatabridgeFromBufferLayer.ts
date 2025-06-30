import IDatabridgeLayer from "./IDatabridgeLayer";

export default class DatabridgeFromBufferLayer implements IDatabridgeLayer<Buffer, string> {
    private _encoding: BufferEncoding;

    constructor(encoding: BufferEncoding = "utf8") {
        this._encoding = encoding;
    }

    process(data: Buffer): Promise<string> {
        return Promise.resolve(data.toString(this._encoding));
    }
}
