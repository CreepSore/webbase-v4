import IDatabridgePacket from "../IDatabridgePacket";

export default interface IDatabridgeSocket {
    sendPacket(packet: IDatabridgePacket<any, any>): IDatabridgeSocket;
    onPacketReceived<T, T2 = any>(callback: (packet: IDatabridgePacket<T, T2>) => void): IDatabridgeSocket;
    removePacketReceived(callback: Function): IDatabridgeSocket;
    waitForPacket<T, T2 = any>(type: string): Promise<IDatabridgePacket<T, T2>>;
    close(): IDatabridgeSocket;
}
