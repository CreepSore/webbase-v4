import IChannelRegistrate from "../channels/IChannelRegistrate";
import IIncomingMessage from "../messages/IIncomingMessage";
import IMessageProcessorRegistrate from "../messages/IMessageProcessorRegistrate";
import IOutgoingMessage from "../messages/IOutgoingMessage";

export default interface IMessageDispatcher {
    get messageProcessors(): IMessageProcessorRegistrate;
    get channels(): IChannelRegistrate;

    setChannelRegistrate(registrate: IChannelRegistrate): this;

    /**
     * @param message The message to dispatch.
     * @returns true if dispatching was successful
     */
    dispatchIncoming(message: IIncomingMessage<any>): Promise<boolean>;

    /**
     * @param message The message to dispatch.
     * @returns true if dispatching was successful
     */
    dispatchOutgoing(message: IOutgoingMessage<any>): Promise<boolean>;
}
