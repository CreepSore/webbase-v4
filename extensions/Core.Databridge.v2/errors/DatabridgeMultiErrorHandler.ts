import IDatabridgeLayer from "../layers/IDatabridgeLayer";
import IDatabridgeErrorHandler from "./IDatabridgeErrorHandler";

export default class DatabridgeMultiErrorHandler implements IDatabridgeErrorHandler<any> {
    private _errorHandlers: Array<IDatabridgeErrorHandler<any>> = [];

    async handleError(error: any, layer: IDatabridgeLayer<any, any>): Promise<boolean> {
        for(const handler of this._errorHandlers) {
            const wasHandled = await handler.handleError(error, layer);
            if(wasHandled) {
                return true;
            }
        }

        return false;
    }

    addHandler(handler: IDatabridgeErrorHandler<any>): this {
        this._errorHandlers.push(handler);
        return this;
    }
}
