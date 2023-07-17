import IOAuthUser from "./IOAuthUser";

export default interface IOAuthTokenCombo {
    id: string;
    authToken: string;
    refreshToken?: string;
    userId: IOAuthUser["id"];
    expiresAt?: Date;
    refreshTokenExpiresAt?: Date;
    createdAt?: Date;
    modifiedAt?: Date;
}
