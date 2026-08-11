type AuthenticationResult<T = any> = {
    success: boolean;
    error?: string;
    errorCode?: string;
    userId?: string | null;
    additionalInformation: T;
};

export default AuthenticationResult;
