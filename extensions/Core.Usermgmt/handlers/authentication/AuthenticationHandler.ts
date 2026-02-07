import * as crypto from "crypto";
import { HydratedDocument } from "mongoose";
import IUser from "../../types/IUser";
import User from "../../models/User";
import AuthenticationParameters from "../../types/AuthenticationParameters";
import AuthenticationResult from "../../types/AuthenticationResult";
import AuthenticationType from "../../types/AuthenticationTypes";
import AuthenticatorRegistry from "./authenticators/AuthenticatorRegistry";

export default class AuthenticationHandler {
    private _registry: AuthenticatorRegistry;
    user: HydratedDocument<IUser>;

    constructor(user: HydratedDocument<IUser>, registry: AuthenticatorRegistry) {
        this.user = user;
        this._registry = registry;
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

    async authenticateType(authenticationType: AuthenticationType, parameter: AuthenticationParameters): Promise<AuthenticationResult> {
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

        const authenticator = this._registry.get(parameter.type, this.user);
        if(!authenticator) {
            return Promise.resolve(AuthenticationHandler.createErrorResult(
                "Invalid Authentication Type",
                "INVALID_AUTHENTICATION_TYPE",
            ));
        }

        const authenticationResult = await authenticator.authenticate(authenticationType, parameter);
        if(authenticationResult.success === true) {
            authenticationResult.userId = this.user._id.toString();
        }

        return authenticationResult;
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

    static createSuccessResult(userId: string = null): AuthenticationResult {
        return {
            success: true,
            additionalInformation: {},
            error: null,
            errorCode: null,
            userId,
        };
    }

    static createErrorResult(error: string, errorCode: string): AuthenticationResult {
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

    static async fromUsername(username: string, registry: AuthenticatorRegistry): Promise<AuthenticationHandler> {
        return new AuthenticationHandler(await User.findOne({username}), registry);
    }
}
