import * as uuid from "uuid";
import IDatabridgeLayer, { DatabridgeDefaultPipelineMetadata } from "../IDatabridgeLayer";
import DatabridgePartyPacket from "./DatabridgePartyPacket";

export type DatabridgePartyMetadata = DatabridgeDefaultPipelineMetadata & {
    partyLayer: {
        id: string;
        fromParty: string;
        toParty: string;
    }
};

export default class DatabridgePartyClientLayer<TPayload> implements IDatabridgeLayer<
    DatabridgePartyPacket<TPayload>,
    TPayload,
    TPayload,
    DatabridgePartyPacket<TPayload>,
    DatabridgePartyMetadata
> {
    private _myParty: string;
    private _targetParty: string;

    constructor(myParty: string, targetParty: string) {
        this._myParty = myParty;
        this._targetParty = targetParty;
    }

    processInbound(data: DatabridgePartyPacket<TPayload>, metadata: DatabridgePartyMetadata): Promise<TPayload> {
        // @ts-ignore
        metadata.partyLayer ??= {};
        metadata.partyLayer.id = data.id;
        metadata.partyLayer.fromParty = data.fromParty;
        metadata.partyLayer.toParty = data.toParty;

        return Promise.resolve(data.payload);
    }

    processOutbound(data: TPayload, metadata: DatabridgePartyMetadata): Promise<DatabridgePartyPacket<TPayload>> {
        return Promise.resolve({
            id: uuid.v4(),
            fromParty: this._myParty,
            toParty: this._targetParty,
            payload: data
        });
    }
}
