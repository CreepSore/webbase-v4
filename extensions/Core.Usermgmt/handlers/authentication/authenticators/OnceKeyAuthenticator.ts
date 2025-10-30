import { HydratedDocument } from "mongoose";
import { OnceKeyAuthenticationParameters } from "../../../types/AuthenticationParameters";
import AuthenticationResult from "../../../types/AuthenticationResult";
import { OnceKeyAuthenticationType } from "../../../types/AuthenticationTypes";
import IAuthenticator from "./IAuthenticator";
import IUser from "../../../types/IUser";
import AuthenticationHandler from "../AuthenticationHandler";
import User from "../../../models/User";

export default class OnceKeyAuthenticator implements IAuthenticator<OnceKeyAuthenticationType, OnceKeyAuthenticationParameters> {
    private _user: HydratedDocument<IUser>;

    constructor(user: HydratedDocument<IUser>) {
        this._user = user;
    }

    async authenticate(authenticationType: OnceKeyAuthenticationType, parameter: OnceKeyAuthenticationParameters): Promise<AuthenticationResult> {
        if(!authenticationType.keys.includes(parameter.key)) {
            return AuthenticationHandler.createErrorResult("Invalid Key", "INVALID_KEY");
        }

        await User.updateOne(
            { _id: this._user._id },
            { $pull: { "authentication.$[].keys": parameter.key }},
        );

        return AuthenticationHandler.createSuccessResult(this._user._id.toString());
    }
}
