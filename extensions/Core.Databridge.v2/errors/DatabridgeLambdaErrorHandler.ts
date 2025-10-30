import IDatabridgeLayer from "../layers/IDatabridgeLayer";
import IDatabridgeErrorHandler from "./IDatabridgeErrorHandler";

export default class DatabridgeLambdaErrorHandler<TError> implements IDatabridgeErrorHandler<TError> {
    handleError(error: TError, layer: IDatabridgeLayer<any, any>): Promise<boolean> { return Promise.resolve(false); }

    constructor(handleError: IDatabridgeErrorHandler<TError>["handleError"] = null) {
        this.handleError = handleError || this.handleError;
    }
}
