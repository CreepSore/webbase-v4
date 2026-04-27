import IInboundChannel from "../inbound/IInboundChannel";
import IOutboundChannel from "../outbound/IOutboundChannel";

export default interface IDuplexChannel<TIn, TOut = TIn> extends IInboundChannel<TIn>, IOutboundChannel<TOut> {

}
