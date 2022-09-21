
export default interface IDatabridgePacket<T, T2 = any> {
    id: string;
    time: number;
    type: string;
    data: T;
    metadata: T2;
}
