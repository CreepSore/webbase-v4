import IOAuthUser, { IOAuthUserAuthenticationParameter } from "@extensions/Core.OAuth2.Db/models/interfaces/IOAuthUser";
import OAuthUser from "@extensions/Core.OAuth2.Db/models/OAuthUser";
import AuthenticationParameter from "../enums/AuthenticationParameter";
import OAuthErrorFactory from "../errors";
import AuthenticationData, { ApiKeyAuthenticationData, Password2FAAuthenticationData, PasswordAuthenticationData, PasswordResetAuthenticationData } from "../interfaces/AuthenticationData";

export default class OAuthAuthenticationHandler {
    static async doLogin(authData: AuthenticationData): Promise<IOAuthUser> {
        if(authData.type === AuthenticationParameter.ApiKey) {
            return await this.handleApiKeyLogin(authData);
        }

        let user: IOAuthUser;

        if(authData.name && authData.email) {
            throw OAuthErrorFactory.invalidArguments();
        }
        else if(authData.name) {
            user = await OAuthUser.loadByUsername(authData.name);
            if(!user) throw OAuthErrorFactory.invalidUsername();
        }
        else if(authData.email) {
            user = await OAuthUser.loadByEmail(authData.email);
            if(!user) throw OAuthErrorFactory.invalidEmail();
        }
        else {
            throw OAuthErrorFactory.invalidArguments();
        }

        if(
            authData.type === AuthenticationParameter.Password ||
            authData.type === AuthenticationParameter.Password2FA
        ) {
            return await this.handlePasswordLogin(user, authData);
        }
        else if(authData.type === AuthenticationParameter.PasswordReset) {
            return await this.handlePasswordReset(user, authData);
        }

        throw OAuthErrorFactory.invalidAuthenticationType();
    }

    private static async handlePasswordLogin(
        user: IOAuthUser,
        authData: PasswordAuthenticationData|Password2FAAuthenticationData,
    ): Promise<IOAuthUser> {
        const userAuthParams: IOAuthUserAuthenticationParameter[] = await OAuthUser.getAuthParameters(user.id);
        const setParams: AuthenticationParameter[] = userAuthParams.map(param => param.type);

        if(setParams.includes(AuthenticationParameter.PasswordReset)) {
            throw OAuthErrorFactory.passwordResetRequested();
        }

        let tfaValid = true;
        if(setParams.includes(AuthenticationParameter.Password2FA)) {
            if(authData.type === AuthenticationParameter.Password2FA) {
                tfaValid = await this.handlePassword2FALogin(user, authData);
            }

            throw OAuthErrorFactory.needs2FA();
        }

        if(!tfaValid) {
            throw OAuthErrorFactory.logonFailed();
        }

        let passwordValid = true;
        if(setParams.includes(AuthenticationParameter.Password)) {
            const hashedPassword = userAuthParams.find(param => param.type === AuthenticationParameter.Password)?.value;
            const providedPassword = OAuthUser.hashPassword(authData.password);

            passwordValid = hashedPassword === providedPassword;
        }

        return passwordValid && tfaValid ? user : null;
    }

    private static async handlePassword2FALogin(
        user: IOAuthUser,
        authData: Password2FAAuthenticationData,
    ): Promise<boolean> {
        // const twoFactorKey = await OAuthUser.getAuthParamValue(user.id, AuthenticationParameter.Password2FA);

        // TODO: Implement

        throw OAuthErrorFactory.invalidAuthenticationType();
    }

    private static async handlePasswordReset(
        user: IOAuthUser,
        authData: PasswordResetAuthenticationData,
    ): Promise<IOAuthUser> {
        const newHashedPassword = OAuthUser.hashPassword(authData.password);

        await OAuthUser.setAuthParamValue(user.id, AuthenticationParameter.Password, newHashedPassword);
        await OAuthUser.unsetAuthParamValue(user.id, AuthenticationParameter.PasswordReset);
        return user;
    }

    private static async handleApiKeyLogin(authData: ApiKeyAuthenticationData): Promise<IOAuthUser> {
        const user: IOAuthUser = await OAuthUser.loadByApiKey(authData.apiKey);
        return user || null;
    }
}
