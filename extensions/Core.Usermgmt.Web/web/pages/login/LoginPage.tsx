import * as React from "react";
import useMe from "@extensions/Core.Usermgmt.Web/web/hooks/useMe";
import IUser from "@extensions/Core.Usermgmt/types/IUser";
import UsermgmtWebApi from "../../UsermgmtWebApi";
import { Alert, Button, CircularProgress, Container, MenuItem, Paper, Select, TextField } from "@mui/material";
import AuthenticationType from "@extensions/Core.Usermgmt/types/AuthenticationTypes";
import AuthenticationParameters from "@extensions/Core.Usermgmt/types/AuthenticationParameters";
import Loader from "@extensions/Core.React/Loader/Loader";

enum LoginStep {
    INVALID_STATE = 0,
    USER_INPUT,
    CHOOSE_AUTH_TYPE,
    DO_LOGIN_PASSWORD,
    DO_LOGIN_TOTP,
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
} as const;

export default function LoginPage(props: LoginPageProperties): JSX.Element {
    const me = useMe();
    const [step, setStep] = React.useState<LoginStep>(LoginStep.USER_INPUT);

    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [totp, setTotp] = React.useState("");

    const [loginError, setLoginError] = React.useState("");

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

    const buildAuthParameters = (): AuthenticationParameters & {username: string} => {
        const result: any = {type: selectedAuthenticationType, username};

        if(password) {
            result.password = password;
        }

        if(totp) {
            result.totp = totp;
        }

        return result as AuthenticationParameters & {username: string};
    };

    const doLogin = async(): Promise<void> => {
        try {
            const loginResult = await UsermgmtWebApi.login(buildAuthParameters());
            if(!loginResult.success) {
                if(loginResult.error) {
                    setLoginError(loginResult.error);
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

            const authTypes = await UsermgmtWebApi.getAuthenticationTypes(username);
            setAuthenticationTypes(authTypes);

            if(authTypes.length > 0) {
                setSelectedAuthenticationType(authTypes[0]);

                const newState = stateMapping[authTypes[0]];
                if(!newState) {
                    return;
                }

                setStep(newState);
                return;
            }

            if(authTypes.length === 1) {
                setStep(LoginStep.CHOOSE_AUTH_TYPE);
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
                doLogin();
            }
            else if(selectedAuthenticationType === "password_totp") {
                setStep(LoginStep.DO_LOGIN_TOTP);
            }
            return;
        }

        if(step === LoginStep.DO_LOGIN_TOTP) {
            doLogin();
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
                    <h1 className="font-thin text-2xl pb-2">Login</h1>

                    {step === LoginStep.LOADING && <div className="flex items-center justify-center py-4">
                        <CircularProgress />
                    </div>}

                    {loginError && <Alert severity="error">{loginError}</Alert>}

                    {step !== LoginStep.LOADING && <TextField
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        label="Username"
                        disabled={step !== LoginStep.USER_INPUT}
                        size={step !== LoginStep.USER_INPUT ? "small" : "medium"}
                    />}

                    {step === LoginStep.CHOOSE_AUTH_TYPE &&
                        <Select
                            value={selectedAuthenticationType}
                            onChange={e => setSelectedAuthenticationType(e.target.value as AuthenticationType["type"])}
                            disabled={step !== LoginStep.CHOOSE_AUTH_TYPE}
                            size={step !== LoginStep.CHOOSE_AUTH_TYPE ? "small" : "medium"}
                        >
                            {authenticationTypes.map(at => <MenuItem key={at} value={at}>{at}</MenuItem>)}
                        </Select>
                    }

                    {step === LoginStep.DO_LOGIN_PASSWORD && <>
                        <TextField
                            type="password"
                            label="Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            disabled={step !== LoginStep.DO_LOGIN_PASSWORD}
                            size={step !== LoginStep.DO_LOGIN_PASSWORD ? "small" : "medium"}
                            autoFocus
                        />
                    </>}

                    {step !== LoginStep.LOADING && <Button variant="outlined" type="submit">Login</Button>}
                </form>
            </Paper>
        </Container>
    </Paper>;
}
