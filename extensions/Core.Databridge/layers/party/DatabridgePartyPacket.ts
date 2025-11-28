type DatabridgePartyPacket<TPayload> = {
    id: string;
    fromParty: string;
    toParty: string;
    payload: TPayload;
}

export default DatabridgePartyPacket;
