type BasicAuthenticationType<Type> = {
    type: Type;
};

type PasswordAuthenticationType = BasicAuthenticationType<"password"> & {
    password: string;
};

type TotpAuthenticationType = BasicAuthenticationType<"totp"> & {
    secret: string;
};

type PasswordTotpAuthenticationType = (
    BasicAuthenticationType<"password_totp">
    & Omit<PasswordAuthenticationType, "type">
    & Omit<TotpAuthenticationType, "type">
);

type AuthenticationType = (
    PasswordAuthenticationType
    | TotpAuthenticationType
    | PasswordTotpAuthenticationType
);

export type {
    PasswordAuthenticationType,
    TotpAuthenticationType,
    PasswordTotpAuthenticationType,
};

export default AuthenticationType;

