import IIncomingMessageProcessor from "./IInboundMessageProcessor";
import IOutgoingMessageProcessor from "./IOutgoingMessageProcessor";

export default interface IMessageProcessor<TIn, TOut> extends IIncomingMessageProcessor<TIn>, IOutgoingMessageProcessor<TOut> {

}