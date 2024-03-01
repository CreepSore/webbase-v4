import * as React from "react";
import useMe from "@extensions/Core.Usermgmt.Web/web/hooks/useMe";
import IUser from "@extensions/Core.Usermgmt/types/IUser";
import UsermgmtWebApi from "../../UsermgmtWebApi";
import { Alert, Button, CircularProgress, Container, IconButton, MenuItem, Paper, Select, TextField } from "@mui/material";
import AuthenticationType from "@extensions/Core.Usermgmt/types/AuthenticationTypes";
import AuthenticationParameters from "@extensions/Core.Usermgmt/types/AuthenticationParameters";
import Loader from "@extensions/Core.React/Loader/Loader";
import TotpInput from "../../components/TotpInput/TotpInput";

enum LoginStep {
    INVALID_STATE = 0,
    USER_INPUT,
    CHOOSE_AUTH_TYPE,
    DO_LOGIN_PASSWORD,
    DO_LOGIN_TOTP,
    DO_LOGIN_KEY,
    LOADING,
    FINISHED,
}

interface LoginPageProperties {
    onLogin?: (me: IUser) => void;
}

const stateMapping: Record<string, LoginStep> = {
    password: LoginStep.DO_LOGIN_PASSWORD,
    password_totp: LoginStep.DO_LOGIN_PASSWORD,
    totp: LoginStep.DO_LOGIN_TOTP,
    once_key: LoginStep.DO_LOGIN_KEY,
    permanent_key: LoginStep.DO_LOGIN_KEY,
} as const;

export default function LoginPage(props: LoginPageProperties): JSX.Element {
    const me = useMe();
    const [step, setStep] = React.useState<LoginStep>(LoginStep.USER_INPUT);

    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [key, setKey] = React.useState("");
    const [totp, setTotp] = React.useState("");

    const [loginError, setLoginError] = React.useState("");
    const isUserError = React.useMemo(() => loginError.includes?.("User"), [loginError]);

    const [selectedAuthenticationType, setSelectedAuthenticationType] = React.useState<AuthenticationType["type"]>(null);
    const [authenticationTypes, setAuthenticationTypes] = React.useState<AuthenticationType["type"][]>(null);

    React.useEffect(() => {
        if(me.me) {
            if(me.me.username === "Anonymous") {
                return;
            }

            props.onLogin?.(me.me);
        }
    }, [me]);

    React.useEffect(() => {
        if(totp.length === 6) {
            continueLoginProcess();
        }
    }, [totp]);

    const buildAuthParameters = (): AuthenticationParameters & {username: string} => {
        const result: any = {type: selectedAuthenticationType, username};

        if(password) {
            result.password = password;
        }

        if(totp) {
            result.totp = totp;
        }

        if(key) {
            result.key = key;
        }

        return result as AuthenticationParameters & {username: string};
    };

    const doLogin = async(): Promise<void> => {
        try {
            const loginResult = await UsermgmtWebApi.login(buildAuthParameters());
            if(!loginResult.success) {
                if(loginResult.error) {
                    setLoginError(loginResult.error);

                    if(
                        selectedAuthenticationType === "password_totp"
                        || selectedAuthenticationType === "totp"
                        || selectedAuthenticationType === "once_key"
                        || selectedAuthenticationType === "permanent_key"
                    ) {
                        setStep(LoginStep.USER_INPUT);
                    }
                    else if(selectedAuthenticationType === "password") {
                        setStep(LoginStep.DO_LOGIN_PASSWORD);
                    }
                }
                return;
            }

            me.update();
        }
        catch(ex) {
            setLoginError(ex);
            setStep(LoginStep.USER_INPUT);
        }
    };

    const continueLoginProcess = async(): Promise<void> => {
        if(step === LoginStep.USER_INPUT) {
            setPassword("");
            setTotp("");
            setLoginError("");
            setKey("");

            const authTypes = await UsermgmtWebApi.getUserAuthenticationTypes(username);
            if(!authTypes) {
                setLoginError("Invalid Username");
                return;
            }

            setAuthenticationTypes(authTypes);

            if(authTypes.length !== 0) {
                setSelectedAuthenticationType(authTypes[0]);
            }

            if(authTypes.length > 1) {
                setStep(LoginStep.CHOOSE_AUTH_TYPE);
                return;
            }

            if(authTypes.length === 1) {
                const newState = stateMapping[authTypes[0]];
                if(!newState) {
                    return;
                }

                setStep(newState);

                return;
            }

            setStep(LoginStep.CHOOSE_AUTH_TYPE);
            return;
        }

        if(step === LoginStep.CHOOSE_AUTH_TYPE) {
            const newState = stateMapping[selectedAuthenticationType];
            if(!newState) {
                return;
            }

            setStep(newState);
            return;
        }

        if(step === LoginStep.DO_LOGIN_PASSWORD) {
            if(selectedAuthenticationType === "password") {
                setStep(LoginStep.LOADING);
                await doLogin();
            }
            else if(selectedAuthenticationType === "password_totp") {
                setStep(LoginStep.DO_LOGIN_TOTP);
            }
            return;
        }

        if(step === LoginStep.DO_LOGIN_TOTP) {
            await doLogin();
            return;
        }

        if(step === LoginStep.DO_LOGIN_KEY) {
            await doLogin();
            return;
        }
    };

    return <Paper className="w-[100vw] h-[100vh] flex justify-center items-center" square>
        <Container maxWidth="xs">
            <Paper className="p-3" elevation={3}>
                {step === LoginStep.LOADING && <Loader />}

                <form
                    className="flex flex-col gap-2"
                    onSubmit={e => {
                        e.preventDefault();
                        continueLoginProcess();
                    }}
                >
                    <div className="flex justify-between w-full mb-4">
                        <h1 className="font-thin text-2xl pb-2">Login</h1>
                        {step !== LoginStep.USER_INPUT && <div>
                            <Button
                                size="small"
                                variant="text"
                                onClick={() => {
                                    setStep(LoginStep.USER_INPUT);
                                }}
                            >Cancel</Button>
                        </div>}
                    </div>

                    {step === LoginStep.LOADING && <div className="flex items-center justify-center py-4">
                        <CircularProgress />
                    </div>}

                    {loginError && <Alert severity="error">{loginError}</Alert>}

                    {step !== LoginStep.LOADING && <TextField
                        variant="standard"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        label="Username"
                        disabled={step !== LoginStep.USER_INPUT}
                        size={step !== LoginStep.USER_INPUT ? "small" : "medium"}
                        autoFocus={step === LoginStep.USER_INPUT}
                        error={isUserError}
                    />}

                    {step === LoginStep.CHOOSE_AUTH_TYPE &&
                        <Select
                            value={selectedAuthenticationType}
                            onChange={e => setSelectedAuthenticationType(e.target.value as AuthenticationType["type"])}
                            disabled={step !== LoginStep.CHOOSE_AUTH_TYPE}
                            size={step !== LoginStep.CHOOSE_AUTH_TYPE ? "small" : "medium"}
                            autoFocus
                        >
                            {authenticationTypes.map(at => <MenuItem key={at} value={at}>{at}</MenuItem>)}
                        </Select>
                    }

                    {step === LoginStep.DO_LOGIN_PASSWORD && <TextField
                        variant="standard"
                        type="password"
                        label="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        disabled={step !== LoginStep.DO_LOGIN_PASSWORD}
                        size={step !== LoginStep.DO_LOGIN_PASSWORD ? "small" : "medium"}
                        autoFocus
                    />}

                    {step === LoginStep.DO_LOGIN_TOTP && <TotpInput
                        onFinished={(totpValue) => {
                            setTotp(totpValue);
                        }}
                        autoFocus
                    />}

                    {step === LoginStep.DO_LOGIN_KEY && <TextField
                        variant="standard"
                        label={selectedAuthenticationType === "once_key" ? "One-Time Key" : "Key"}
                        value={key}
                        onChange={e => setKey(e.target.value)}
                        disabled={step !== LoginStep.DO_LOGIN_KEY}
                        size={step !== LoginStep.DO_LOGIN_KEY ? "small" : "medium"}
                        autoFocus
                    />}

                    {step !== LoginStep.LOADING && step !== LoginStep.DO_LOGIN_TOTP && <Button variant="outlined" type="submit" className="!mt-4">Login</Button>}
                </form>
            </Paper>
        </Container>
    </Paper>;
}
