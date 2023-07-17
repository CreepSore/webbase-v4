import AuthenticationParameter from "../enums/AuthenticationParameter";

export interface BaseAuthenticationData<T extends AuthenticationParameter = any> {
    type: T;
    name?: string;
    email?: string;
}

export interface PasswordAuthenticationData extends BaseAuthenticationData<AuthenticationParameter.Password> {
    password: string;
}

export interface ApiKeyAuthenticationData extends BaseAuthenticationData<AuthenticationParameter.ApiKey> {
    apiKey: string;
}

export interface Password2FAAuthenticationData extends BaseAuthenticationData<AuthenticationParameter.Password2FA> {
    password: string;
    code: string;
}

export interface PasswordResetAuthenticationData extends BaseAuthenticationData<AuthenticationParameter.PasswordReset> {
    password: string;
}

type AuthenticationData = (
    PasswordAuthenticationData |
    ApiKeyAuthenticationData |
    Password2FAAuthenticationData |
    PasswordResetAuthenticationData
);

export default AuthenticationData;
