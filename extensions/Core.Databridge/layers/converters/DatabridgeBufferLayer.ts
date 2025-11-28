import IDatabridgeLayer from "../IDatabridgeLayer";

export default class DatabridgeBufferLayer implements IDatabridgeLayer<Buffer, string, string, Buffer> {
    private _encoding: BufferEncoding;

    constructor(encoding: BufferEncoding = "utf8") {
        this._encoding = encoding;
    }

    processInbound(data: Buffer): Promise<string> {
        return Promise.resolve(data.toString(this._encoding));
    }

    processOutbound(data: string): Promise<Buffer> {
        return Promise.resolve(Buffer.from(data));
    }
}
