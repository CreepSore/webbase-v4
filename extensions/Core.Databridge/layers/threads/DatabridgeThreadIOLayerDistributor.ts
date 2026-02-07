import IncomingThreadMessage from "../../../../src/logic/threads/messages/IncomingThreadMessage";
import IDatabridgeInboundLayer from "../IDatabridgeInboundLayer";
import { DatabridgeDefaultPipelineMetadata } from "../IDatabridgeLayer";

export default class DatabridgeThreadIOLayerDistributor implements IDatabridgeInboundLayer<IncomingThreadMessage<any>, IncomingThreadMessage<any>> {
    private _handlers: Map<string, (message: IncomingThreadMessage<any, any>) => Promise<IncomingThreadMessage<any, any>> | IncomingThreadMessage<any, any>> = new Map();

    async processInbound(data: IncomingThreadMessage<any, string>, metadata: DatabridgeDefaultPipelineMetadata): Promise<IncomingThreadMessage<any, string>> {
        let currentMessage = data;

        for(const [key, handler] of this._handlers.entries()) {
            if(currentMessage.type !== key) {
                continue;
            }

            currentMessage = await handler(currentMessage);
        }

        return currentMessage;
    }

    addHandler<TPayload, TType extends string = string>(
        type: TType,
        handler: (message: IncomingThreadMessage<TPayload, TType>) =>
            Promise<IncomingThreadMessage<any, any>>
            | IncomingThreadMessage<TPayload, TType>,
    ): this {
        this._handlers.set(type, handler);
        return this;
    }
}
