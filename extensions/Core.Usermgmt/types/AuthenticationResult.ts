type AuthenticationResult<T = any> = {
    success: boolean;
    error: string;
    errorCode: string;
    userId: string;
    additionalInformation: T;
};

export default AuthenticationResult;
