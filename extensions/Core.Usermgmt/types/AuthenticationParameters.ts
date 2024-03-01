import {
    OnceKeyAuthenticationType,
    PasswordAuthenticationType,
    PasswordTotpAuthenticationType,
    PermanentKeyAuthenticationType,
    TotpAuthenticationType,
} from "./AuthenticationTypes";

type PasswordAuthenticationParameters = {
    type: PasswordAuthenticationType["type"];
    password: string;
};

type TotpAuthenticationParameters = {
    type: TotpAuthenticationType["type"]
    totp: string;
};

type PasswordTotpAuthenticationParameters = {
    type: PasswordTotpAuthenticationType["type"]
    password: string;
    totp: string;
};

type PermanentKeyAuthenticationParameters = {
    type: PermanentKeyAuthenticationType["type"]
    key: string;
};

type OnceKeyAuthenticationParameters = {
    type: OnceKeyAuthenticationType["type"]
    key: string;
};

type AuthenticationParameters = (
    PasswordAuthenticationParameters
    | TotpAuthenticationParameters
    | PasswordTotpAuthenticationParameters
    | PermanentKeyAuthenticationParameters
    | OnceKeyAuthenticationParameters
);

export type {
    PasswordAuthenticationParameters,
    TotpAuthenticationParameters,
    PasswordTotpAuthenticationParameters,
    PermanentKeyAuthenticationParameters,
    OnceKeyAuthenticationParameters,
};

export default AuthenticationParameters;
