import IDatabridgeLayer from "../layers/IDatabridgeLayer";

export default interface IDatabridgeErrorHandler<TError = any> {
    /**
     * @returns Returns true if the error has been handled successfully
     */
    handleError(error: TError, layer: IDatabridgeLayer<any, any>): Promise<boolean>;
}
