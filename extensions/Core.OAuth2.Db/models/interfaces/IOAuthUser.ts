import AuthenticationParameter from "@extensions/Core.OAuth2/enums/AuthenticationParameter";

export default interface IOAuthUser {
    id: string;

    name: string;
    email?: string;

    createdAt?: Date;
    modifiedAt?: Date;
}

export interface IOAuthUserAuthenticationParameter {
    userId: string;
    type: AuthenticationParameter;
    value?: string;
    createdAt?: Date;
    modifiedAt?: Date;
}
