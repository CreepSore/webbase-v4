import { PasswordTotpAuthenticationParameters } from "../../../types/AuthenticationParameters";
import AuthenticationResult from "../../../types/AuthenticationResult";
import { PasswordTotpAuthenticationType } from "../../../types/AuthenticationTypes";
import IAuthenticator from "./IAuthenticator";
import PasswordAuthenticator from "./PasswordAuthenticator";
import TotpAuthenticator from "./TotpAuthenticator";

export default class PasswordTotpAuthentication implements IAuthenticator<PasswordTotpAuthenticationType, PasswordTotpAuthenticationParameters> {
    private _passwordAuthenticator = new PasswordAuthenticator();
    private _totpAuthenticator = new TotpAuthenticator();

    async authenticate(authenticationType: PasswordTotpAuthenticationType, parameter: PasswordTotpAuthenticationParameters): Promise<AuthenticationResult> {
        const passwordAuthResult = await this._passwordAuthenticator.authenticate({
            type: "password",
            password: authenticationType.password,
        }, {
            type: "password",
            password: parameter.password,
        });

        if(!passwordAuthResult.success) {
            return passwordAuthResult;
        }

        const totpAuthResult = await this._totpAuthenticator.authenticate({
            type: "totp",
            secret: authenticationType.secret,
        }, {
            type: "totp",
            totp: parameter.totp,
        });

        return totpAuthResult;
    }
}
