export const enum OAuthError {
    invalidUsername = "INVALID_USERNAME",
    invalidEmail = "INVALID_EMAIL",
    invalidPassword = "INVALID_PASSWORD",
    invalidArguments = "INVALID_ARGUMENTS",
    invalidAuthenticationType = "INVALID_AUTHENTICATION_TYPE",
    needs2FA = "NEEDS_2FA",
    needsPasswordReset = "NEEDS_PASSWORD_RESET",
    passwordResetRequested = "PASSWORD_RESET_REQUESTED",
    logonFailed = "LOGON_FAILED",
    invalidClient = "INVALID_CLIENT",
    invalidClientSecret = "INVALID_CLIENT_SECRET",
    invalidRedirectUri = "INVALID_REDIRECT_URI",
    invalidCode = "INVALID_CODE",
    invalidToken = "INVALID_TOKEN",
}

export default class OAuthErrorFactory {
    static invalidUsername = (): Error => new Error(OAuthError.invalidUsername);
    static invalidEmail = (): Error => new Error(OAuthError.invalidEmail);
    static invalidPassword = (): Error => new Error(OAuthError.invalidPassword);
    static invalidArguments = (): Error => new Error(OAuthError.invalidArguments);
    static invalidAuthenticationType = (): Error => new Error(OAuthError.invalidAuthenticationType);
    static needs2FA = (): Error => new Error(OAuthError.needs2FA);
    static needsPasswordReset = (): Error => new Error(OAuthError.needsPasswordReset);
    static passwordResetRequested = (): Error => new Error(OAuthError.passwordResetRequested);
    static logonFailed = (): Error => new Error(OAuthError.logonFailed);
    static invalidClient = (): Error => new Error(OAuthError.invalidClient);
    static invalidClientSecret = (): Error => new Error(OAuthError.invalidClientSecret);
    static invalidRedirectUri = (): Error => new Error(OAuthError.invalidRedirectUri);
    static invalidCode = (): Error => new Error(OAuthError.invalidCode);
    static invalidToken = (): Error => new Error(OAuthError.invalidToken);
}

