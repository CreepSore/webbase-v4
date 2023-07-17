export default interface IAuthTokenResponse {
    authToken: string;
    refreshToken: string;
    /**
     * Expires in seconds
     */
    expiresIn: number;
    scopes: string[];
}
