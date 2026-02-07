import { HydratedDocument } from "mongoose";
import AuthenticationResult from "../../../types/AuthenticationResult";
import IAuthenticator from "./IAuthenticator";
import IUser from "../../../types/IUser";
import AuthenticationHandler from "../AuthenticationHandler";
import { PermanentKeyAuthenticationParameters } from "../../../types/AuthenticationParameters";
import { PermanentKeyAuthenticationType } from "../../../types/AuthenticationTypes";

export default class PermanentKeyAuthenticator implements IAuthenticator<PermanentKeyAuthenticationType, PermanentKeyAuthenticationParameters> {
    private _user: HydratedDocument<IUser>;

    constructor(user: HydratedDocument<IUser>) {
        this._user = user;
    }

    async authenticate(authenticationType: PermanentKeyAuthenticationType, parameter: PermanentKeyAuthenticationParameters): Promise<AuthenticationResult> {
        if(!authenticationType.keys.includes(parameter.key)) {
            return AuthenticationHandler.createErrorResult("Invalid Key", "INVALID_KEY");
        }

        return AuthenticationHandler.createSuccessResult(this._user._id.toString());
    }
}
