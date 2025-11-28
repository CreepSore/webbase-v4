import AuthenticationResult from "../../../types/AuthenticationResult";
import { BasicAuthenticationType } from "../../../types/AuthenticationTypes";

export default interface IAuthenticator<TAuthenticationType extends BasicAuthenticationType<any>, TAuthenticationParameters> {
    authenticate(authenticationType: TAuthenticationType, parameter: TAuthenticationParameters): Promise<AuthenticationResult>;
}
