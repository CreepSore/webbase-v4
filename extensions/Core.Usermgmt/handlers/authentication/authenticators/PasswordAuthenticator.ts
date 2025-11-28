import { HydratedDocument } from "mongoose";
import { PasswordAuthenticationParameters } from "../../../types/AuthenticationParameters";
import AuthenticationResult from "../../../types/AuthenticationResult";
import { PasswordAuthenticationType } from "../../../types/AuthenticationTypes";
import AuthenticationHandler from "../AuthenticationHandler";
import IAuthenticator from "./IAuthenticator";
import IUser from "../../../types/IUser";

export default class PasswordAuthenticator implements IAuthenticator<PasswordAuthenticationType, PasswordAuthenticationParameters> {
    authenticate(
        authenticationType: PasswordAuthenticationType,
        parameter: PasswordAuthenticationParameters
    ): Promise<AuthenticationResult> {
        if(!parameter.password) {
            return Promise.resolve(AuthenticationHandler.createErrorResult("No password provided", "NO_PASSWORD_PROVIDED"));
        }

        const userPassword = authenticationType.password;
        const hashedPassword = AuthenticationHandler.hashPassword(parameter.password);

        if(userPassword !== hashedPassword) {
            return Promise.resolve(AuthenticationHandler.createErrorResult("Invalid credentials", "INVALID_CREDENTIALS"));
        }

        return Promise.resolve(AuthenticationHandler.createSuccessResult());
    }

}
