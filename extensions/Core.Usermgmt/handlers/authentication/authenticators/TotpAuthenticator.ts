import { TotpAuthenticationParameters } from "../../../types/AuthenticationParameters";
import AuthenticationResult from "../../../types/AuthenticationResult";
import { TotpAuthenticationType } from "../../../types/AuthenticationTypes";
import AuthenticationHandler from "../AuthenticationHandler";
import TotpHandler from "../TotpHandler";
import IAuthenticator from "./IAuthenticator";

export default class TotpAuthenticator implements IAuthenticator<TotpAuthenticationType, TotpAuthenticationParameters> {
    authenticate(authenticationType: TotpAuthenticationType, parameter: TotpAuthenticationParameters): Promise<AuthenticationResult> {
        if(!parameter.totp) {
            return Promise.resolve(AuthenticationHandler.createErrorResult("No totp-code provided", "NO_TOTP_PROVIDED"));
        }

        if(parameter.totp.length !== 6) {
            return Promise.resolve(AuthenticationHandler.createErrorResult("Invalid totp-code length", "INVALID_TOTP_LENGTH"));
        }

        if(parameter.totp.length !== 6) {
            return Promise.resolve(AuthenticationHandler.createErrorResult("Invalid totp key", "INVALID_TOTP_KEY"));
        }

        try {
            if(!TotpHandler.validate(parameter.totp, authenticationType.secret)) {
                return Promise.resolve(AuthenticationHandler.createErrorResult("Invalid totp-code provided", "INVALID_TOTP_CODE"));
            }
        }
        catch {
            return Promise.resolve(AuthenticationHandler.createErrorResult("Failed to calculate TOTP", "TOTP_CALCULATION_FAILED"));
        }

        return Promise.resolve(AuthenticationHandler.createSuccessResult());
    }
}
