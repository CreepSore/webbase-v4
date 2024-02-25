import * as crypto from "crypto";
import { HydratedDocument } from "mongoose";
import IUser from "../types/IUser";
import User from "../models/User";
import AuthenticationParameters, { OnceKeyAuthenticationParameters, PasswordAuthenticationParameters, PasswordTotpAuthenticationParameters, PermanentKeyAuthenticationParameters, TotpAuthenticationParameters } from "../types/AuthenticationParameters";
import AuthenticationResult from "../types/AuthenticationResult";
import AuthenticationType, { OnceKeyAuthenticationType, PasswordAuthenticationType, PasswordTotpAuthenticationType, PermanentKeyAuthenticationType, TotpAuthenticationType } from "../types/AuthenticationTypes";

export default class AuthenticationHandler {
    user: HydratedDocument<IUser>;

    constructor(user: HydratedDocument<IUser>) {
        this.user = user;
    }

    async authenticate(parameter: AuthenticationParameters): Promise<AuthenticationResult> {
        if(!this.user) {
            return Promise.resolve(AuthenticationHandler.createErrorResult(
                "Username does not exist",
                "INVALID_USERNAME",
            ));
        }

        if(!this.user.authentication) {
            return AuthenticationHandler.createErrorResult("Invalid Authentication Type", "INVALID_AUTHENTICATION_TYPE");
        }

        const authenticationType = this.user.authentication.find(a => a.type === parameter.type);
        if(!authenticationType) {
            return AuthenticationHandler.createErrorResult("Invalid Authentication Type", "INVALID_AUTHENTICATION_TYPE");
        }

        return this.authenticateType(authenticationType, parameter);
    }

    authenticateType(authenticationType: AuthenticationType, parameter: AuthenticationParameters): Promise<AuthenticationResult> {
        if(!this.user) {
            return Promise.resolve(AuthenticationHandler.createErrorResult(
                "Username does not exist",
                "INVALID_USERNAME",
            ));
        }

        if(authenticationType.type !== parameter.type) {
            return Promise.resolve(AuthenticationHandler.createErrorResult(
                "Authentication type for this user is not supported",
                "INVALID_AUTHENTICATION_TYPE_FOR_USER",
            ));
        }

        switch(parameter.type) {
            case "password": return this.authenticateWithPasswordAuthentication(
                authenticationType as PasswordAuthenticationType, parameter,
            );
            case "totp": return this.authenticateWithTotpAuthentication(
                authenticationType as TotpAuthenticationType, parameter,
            );
            case "password_totp": return this.authenticateWithPasswordTotpAuthentication(
                authenticationType as PasswordTotpAuthenticationType, parameter,
            );
            case "once_key": return this.authenticateWithOnceKeyAuthentication(
                authenticationType as OnceKeyAuthenticationType, parameter,
            );
            case "permanent_key": return this.authenticateWithPermanentKeyAuthentication(
                authenticationType as PermanentKeyAuthenticationType, parameter,
            );
            default: {
                return Promise.resolve(AuthenticationHandler.createErrorResult(
                    "Invalid Authentication Type",
                    "INVALID_AUTHENTICATION_TYPE",
                ));
            }
        }
    }

    getAuthenticationTypes(): AuthenticationType["type"][] {
        if(!this.user) {
            return null;
        }

        if(!this.user.authentication || this.user.authentication.length === 0) {
            return null;
        }

        return this.user.authentication.map(a => a.type);
    }

    addOrUpdateAuthenticationType(authenticationType: AuthenticationType, save: false): void;
    addOrUpdateAuthenticationType(authenticationType: AuthenticationType, save: true): Promise<IUser>;
    addOrUpdateAuthenticationType(authenticationType: AuthenticationType, save: boolean): Promise<IUser> | void {
        this.deleteAuthenticationType(authenticationType.type, false);
        this.user.authentication.push(authenticationType);

        if(save) {
            return this.user.save();
        }
    }

    deleteAuthenticationType(type: AuthenticationType["type"], save: false): void;
    deleteAuthenticationType(type: AuthenticationType["type"], save: true): Promise<IUser>;
    deleteAuthenticationType(type: AuthenticationType["type"], save: boolean): Promise<IUser> | void {
        this.user.authentication = this.user.authentication.filter(a => a.type !== type);

        if(save) {
            return this.user.save();
        }
    }

    static getRootUser(): Promise<HydratedDocument<IUser>> {
        return User.findOne({username: "Root"}).populate({
            path: "groups",
            populate: {
                path: "permissions",
            },
        });
    }

    static getAnonymousUser(): Promise<HydratedDocument<IUser>> {
        return User.findOne({username: "Anonymous"}).populate({
            path: "groups",
            populate: {
                path: "permissions",
            },
        });
    }

    private async authenticateWithPermanentKeyAuthentication(
        authenticationType: PermanentKeyAuthenticationType,
        parameter: PermanentKeyAuthenticationParameters,
    ): Promise <AuthenticationResult> {
        if(authenticationType.keys.includes(parameter.key)) {
            return {
                success: true,
                additionalInformation: {},
                error: null,
                errorCode: null,
                userId: this.user._id.toString(),
            };
        }
    }

    private async authenticateWithOnceKeyAuthentication(
        authenticationType: OnceKeyAuthenticationType,
        parameter: OnceKeyAuthenticationParameters,
    ): Promise <AuthenticationResult> {
        if(authenticationType.keys.includes(parameter.key)) {
            authenticationType.keys = authenticationType.keys.filter(k => k !== parameter.key);
            await this.user.save();

            return {
                success: true,
                additionalInformation: {},
                error: null,
                errorCode: null,
                userId: this.user._id.toString(),
            };
        }
    }

    private async authenticateWithPasswordAuthentication(
        authenticationType: PasswordAuthenticationType,
        parameter: PasswordAuthenticationParameters,
    ): Promise<AuthenticationResult> {
        if(!parameter.password) {
            return AuthenticationHandler.createErrorResult("No password provided", "NO_PASSWORD_PROVIDED");
        }

        const userPassword = authenticationType.password;
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

    private async authenticateWithTotpAuthentication(
        authenticationType: TotpAuthenticationType,
        parameter: TotpAuthenticationParameters,
    ): Promise<AuthenticationResult> {
        if(!parameter.totp) {
            return AuthenticationHandler.createErrorResult("No totp-code provided", "NO_TOTP_PROVIDED");
        }

        if(parameter.totp.length !== 6) {
            return AuthenticationHandler.createErrorResult("Invalid totp-code length", "INVALID_TOTP_LENGTH");
        }

        // TODO: TOTP
        return AuthenticationHandler.createErrorResult("NOT_IMPLEMENTED", "NOT_IMPLEMENTED");
    }

    private async authenticateWithPasswordTotpAuthentication(
        authenticationType: PasswordTotpAuthenticationType,
        parameter: PasswordTotpAuthenticationParameters,
    ): Promise<AuthenticationResult> {
        if(!parameter.totp) {
            return AuthenticationHandler.createErrorResult("No totp-code provided", "NO_TOTP_PROVIDED");
        }

        if(parameter.totp.length !== 6) {
            return AuthenticationHandler.createErrorResult("Invalid totp-code length", "INVALID_TOTP_LENGTH");
        }

        const passwordAuthResult = await this.authenticateWithPasswordAuthentication({
            type: "password",
            password: authenticationType.password,
        }, {
            type: "password",
            password: authenticationType.password,
        });

        if(!passwordAuthResult.success) {
            return passwordAuthResult;
        }

        const totpAuthResult = await this.authenticateWithTotpAuthentication({
            type: "totp",
            secret: authenticationType.secret,
        }, {
            type: "totp",
            totp: parameter.totp,
        });

        return totpAuthResult;
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
