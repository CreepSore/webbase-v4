import IInboundMessageProcessor from "./IInboundMessageProcessor";
import IMessageProcessor from "./IMessageProcessor";
import IOutgoingMessageProcessor from "./IOutgoingMessageProcessor";

export default interface IMessageProcessorRegistrate {
    get inboundMessageProcessors(): ReadonlySet<IInboundMessageProcessor<any>>;
    get outboundMessageProcessors(): ReadonlySet<IOutgoingMessageProcessor<any>>;
    get duplexMessageProcessors(): ReadonlySet<IMessageProcessor<any, any>>;

    registerInboundProcessor<T>(channel: IInboundMessageProcessor<T>): void;
    registerOutboundProcessor<T>(channel: IOutgoingMessageProcessor<T>): void;
    registerDuplexProcessor<T>(channel: IMessageProcessor<T, T>): void;

    unregisterInboundProcessor<T>(channel: IInboundMessageProcessor<T>): void;
    unregisterOutboundProcessor<T>(channel: IOutgoingMessageProcessor<T>): void;
    unregisterDuplexProcessor<T>(channel: IMessageProcessor<T, T>): void;
}
