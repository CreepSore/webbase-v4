import IIncomingMessageProcessor from "./IInboundMessageProcessor";
import IMessageProcessor from "./IMessageProcessor";
import IMessageProcessorRegistrate from "./IMessageProcessorRegistrate";
import IOutgoingMessageProcessor from "./IOutgoingMessageProcessor";

export default class BasicMessageProcessorRegistrate implements IMessageProcessorRegistrate {
    private _started: boolean = false;

    private _inboundProcessors: Set<IIncomingMessageProcessor<any>> = new Set();
    private _outboundProcessors: Set<IOutgoingMessageProcessor<any>> = new Set()
    private _duplexProcessors: Set<IMessageProcessor<any, any>> = new Set();

    get inboundMessageProcessors(): ReadonlySet<IIncomingMessageProcessor<any>> {
        return this._inboundProcessors;
    }

    get outboundMessageProcessors(): ReadonlySet<IOutgoingMessageProcessor<any>> {
        return this._outboundProcessors;
    }

    get duplexMessageProcessors(): ReadonlySet<IMessageProcessor<any, any>> {
        return this._duplexProcessors;
    }

    registerInboundProcessor<T>(channel: IIncomingMessageProcessor<T>): void {
        this._inboundProcessors.add(channel);
    }

    registerOutboundProcessor<T>(channel: IOutgoingMessageProcessor<T>): void {
        this._outboundProcessors.add(channel);
    }

    registerDuplexProcessor<T>(channel: IMessageProcessor<T, T>): void {
        this._inboundProcessors.add(channel);
        this._outboundProcessors.add(channel);
        this._duplexProcessors.add(channel);
    }

    unregisterInboundProcessor<T>(channel: IIncomingMessageProcessor<T>): void {
        this._inboundProcessors.delete(channel);
    }

    unregisterOutboundProcessor<T>(channel: IOutgoingMessageProcessor<T>): void {
        this._outboundProcessors.delete(channel);
    }

    unregisterDuplexProcessor<T>(channel: IMessageProcessor<T, T>): void {
        this._inboundProcessors.delete(channel);
        this._outboundProcessors.delete(channel);
        this._duplexProcessors.delete(channel);
    }
}
