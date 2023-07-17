
export default interface IAuthenticationRequest {
    clientId: string;
    clientSecret: string;
    scopes: string[];
    redirectUri: string;
    state: string;
}
