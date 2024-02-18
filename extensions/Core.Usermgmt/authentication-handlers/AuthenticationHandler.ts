import * as crypto from "crypto";
import { HydratedDocument } from "mongoose";
import IUser from "../types/IUser";
import User from "../models/User";
import AuthenticationParameters, { PasswordAuthenticationParameters, PasswordTotpAuthenticationParameters, TotpAuthenticationParameters } from "../types/AuthenticationParameters";
import AuthenticationResult from "../types/AuthenticationResult";
import { PasswordAuthenticationType, PasswordTotpAuthenticationType, TotpAuthenticationType } from "../types/AuthenticationTypes";

export default class AuthenticationHandler {
    user: HydratedDocument<IUser>;

    constructor(user: HydratedDocument<IUser>) {
        this.user = user;
    }

    authenticate(parameter: AuthenticationParameters): Promise<AuthenticationResult> {
        if(!this.user) {
            return Promise.resolve(AuthenticationHandler.createErrorResult(
                "Username does not exist",
                "INVALID_USERNAME",
            ));
        }

        if(this.user.authentication?.type !== parameter.type) {
            return Promise.resolve(AuthenticationHandler.createErrorResult(
                "Authentication type for this user is not supported",
                "INVALID_AUTHENTICATION_TYPE_FOR_USER",
            ));
        }

        switch(parameter.type) {
            case "password": return this.authenticateWithPasswordAuthentication(parameter);
            case "totp": return this.authenticateWithTotpAuthentication(parameter);
            case "password_totp": return this.authenticateWithPasswordTotpAuthentication(parameter);
            default: {
                return Promise.resolve(AuthenticationHandler.createErrorResult(
                    "Invalid Authentication Type",
                    "INVALID_AUTHENTICATION_TYPE",
                ));
            }
        }
    }

    getAuthenticationType(): AuthenticationParameters["type"] | "none" {
        if(!this.user.authentication?.type) {
            return "none";
        }

        return this.user.authentication.type;
    }

    private async authenticateWithPasswordAuthentication(parameter: PasswordAuthenticationParameters): Promise<AuthenticationResult> {
        if(!parameter.password) {
            return AuthenticationHandler.createErrorResult("No password provided", "NO_PASSWORD_PROVIDED");
        }

        const userAuthentication = this.user.authentication as PasswordAuthenticationType;
        const userPassword = userAuthentication.password;
        const hashedPassword = AuthenticationHandler.hashPassword(parameter.password);

        if(userPassword !== hashedPassword) {
            return AuthenticationHandler.createErrorResult("Invalid credentials", "INVALID_CREDENTIALS");
        }

        return {
            success: true,
            additionalInformation: {},
            error: null,
            errorCode: null,
            userId: this.user._id.toString(),
        };
    }

    private async authenticateWithTotpAuthentication(parameter: TotpAuthenticationParameters): Promise<AuthenticationResult> {
        if(!parameter.totp) {
            return AuthenticationHandler.createErrorResult("No totp-code provided", "NO_TOTP_PROVIDED");
        }

        if(parameter.totp.length !== 6) {
            return AuthenticationHandler.createErrorResult("Invalid totp-code length", "INVALID_TOTP_LENGTH");
        }

        const userAuthentication = this.user.authentication as TotpAuthenticationType;

        // TODO: TOTP
        return AuthenticationHandler.createErrorResult("NOT_IMPLEMENTED", "NOT_IMPLEMENTED");
    }

    private async authenticateWithPasswordTotpAuthentication(parameter: PasswordTotpAuthenticationParameters): Promise<AuthenticationResult> {
        if(!parameter.password) {
            return AuthenticationHandler.createErrorResult("No password provided", "NO_PASSWORD_PROVIDED");
        }

        if(!parameter.totp) {
            return AuthenticationHandler.createErrorResult("No totp-code provided", "NO_TOTP_PROVIDED");
        }

        if(parameter.totp.length !== 6) {
            return AuthenticationHandler.createErrorResult("Invalid totp-code length", "INVALID_TOTP_LENGTH");
        }

        const userAuthentication = this.user.authentication as PasswordTotpAuthenticationType;
        const userPassword = userAuthentication.password;
        const hashedPassword = AuthenticationHandler.hashPassword(parameter.password);

        if(userPassword !== hashedPassword) {
            return AuthenticationHandler.createErrorResult("Invalid credentials", "INVALID_CREDENTIALS");
        }

        // TODO: TOTP
        return AuthenticationHandler.createErrorResult("NOT_IMPLEMENTED", "NOT_IMPLEMENTED");
    }

    private static createErrorResult(error: string, errorCode: string): AuthenticationResult {
        return {
            success: false,
            error,
            errorCode,
            additionalInformation: {},
            userId: null,
        };
    }

    static hashPassword(password: string): string {
        return crypto
            .createHash("sha256")
            .update(password)
            .digest("hex");
    }

    static async fromUsername(username: string): Promise<AuthenticationHandler> {
        return new AuthenticationHandler(await User.findOne({username}));
    }
}
