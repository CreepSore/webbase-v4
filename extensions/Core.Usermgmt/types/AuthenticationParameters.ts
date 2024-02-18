type PasswordAuthenticationParameters = {
    type: "password";
    password: string;
};

type TotpAuthenticationParameters = {
    type: "totp"
    totp: string;
};

type PasswordTotpAuthenticationParameters = {
    type: "password_totp"
    password: string;
    totp: string;
};

type AuthenticationParameters = (
    PasswordAuthenticationParameters
    | TotpAuthenticationParameters
    | PasswordTotpAuthenticationParameters
);

export type {
    PasswordAuthenticationParameters,
    TotpAuthenticationParameters,
    PasswordTotpAuthenticationParameters,
};

export default AuthenticationParameters;
