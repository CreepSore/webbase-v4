import { IJsonConvertable } from "../../conversion/IJsonConvertable";

export default interface IPayloadEnvelope<TPayload extends {} = any> extends IJsonConvertable {
    open(): TPayload;
}
