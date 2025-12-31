export default interface IOutboundChannel {
    start(): Promise<void>;
    stop(): Promise<void>;
    send(payload: Buffer): Promise<void>;
}
