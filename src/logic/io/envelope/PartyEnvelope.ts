import { IJsonConvertable } from "../../conversion/IJsonConvertable";
import IPayloadEnvelope from "./IPayloadEnvelope";

export default class PartyEnvelope<TPayload extends {} = any> implements IPayloadEnvelope<TPayload> {
    private _payload: TPayload;
    private _party: string;
    private _topic: string;

    get party(): typeof this._party {
        return this._party;
    }

    set party(value: typeof this._party) {
        this._party = value;
    }

    get topic(): typeof this._topic {
        return this._topic;
    }

    set topic(value: typeof this._topic) {
        this._topic = value;
    }

    constructor(party: string = "", topic: string = "", payload: TPayload = {} as TPayload) {
        this._party = party;
        this._topic = topic;
        this._payload = payload;
    }

    open(): TPayload {
        return structuredClone(this._payload);
    }

    toJson(): string {
        return JSON.stringify({
            party: this._party,
            topic: this._topic,
            payload: this._payload
        });
    }

    applyJson(json: string): this {
        const data = JSON.parse(json);
        if(data.party) {
            this._party = data.party;
        }

        if(data.topic) {
            this._topic = data.topic;
        }

        if(data.payload) {
            this._payload = data.payload;
        }

        return this;
    }
}
