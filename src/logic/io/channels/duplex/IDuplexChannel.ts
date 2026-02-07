import IInboundChannel from "../inbound/IInboundChannel";
import IOutboundChannel from "../outbound/IOutboundChannel";

export default interface IDuplexChannel extends IInboundChannel, IOutboundChannel {

}
