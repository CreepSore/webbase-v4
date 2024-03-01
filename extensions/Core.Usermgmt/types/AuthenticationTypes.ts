type BasicAuthenticationType<Type> = {
    type: Type;
};

type PasswordAuthenticationType = BasicAuthenticationType<"password"> & {
    password: string;
};

type TotpAuthenticationType = BasicAuthenticationType<"totp"> & {
    secret: string;
};

type PermanentKeyAuthenticationType = BasicAuthenticationType<"permanent_key"> & {
    keys: string[];
};

type OnceKeyAuthenticationType = BasicAuthenticationType<"once_key"> & {
    keys: string[];
};

type PasswordTotpAuthenticationType = BasicAuthenticationType<"password_totp"> & {
    password: string;
    secret: string;
};

type AuthenticationType = (
    PasswordAuthenticationType
    | TotpAuthenticationType
    | PasswordTotpAuthenticationType
    | PermanentKeyAuthenticationType
    | OnceKeyAuthenticationType
);

export type {
    PasswordAuthenticationType,
    TotpAuthenticationType,
    PasswordTotpAuthenticationType,
    PermanentKeyAuthenticationType,
    OnceKeyAuthenticationType,
};

export default AuthenticationType;

