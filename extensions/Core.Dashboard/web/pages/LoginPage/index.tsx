import { useMutation } from "@extensions/Core.GraphQL/web/GraphQLHooks";
import React from "react";


import "./style.css";
import { Alert, Button, Card, Paper, TextField } from "@mui/material";

interface LoginPageProps {
    onLoginSuccess?: (userId: string) => void;
    onLoginFailure?: () => void;
}

const errorMapping: {[key: string]: string} = {
    INVALID_CREDENTIALS: "Invalid username or password",
    USER_INACTIVE: "User is inactive. Please contact the administrator",
};

export default function LoginPage(props: LoginPageProps): JSX.Element {
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");

    const [loginError, setLoginError] = React.useState("");
    const [usernameError, setUsernameError] = React.useState(false);
    const [passwordError, setPasswordError] = React.useState(false);


    const doLoginMutation = useMutation(`mutation Login($username: String!, $password: String!) {
        loginByCredentials(username:$username, password:$password)
    }`, {onSuccess: (data: string, errors) => {
        if(errors?.length > 0) {
            setLoginError(errorMapping[errors[0].message] || errors[0].message);
        }
        else {
            setLoginError("");

            const redirect = new URLSearchParams(window.location.search).get("redirect");
            if(redirect) {
                location.href = redirect;
                return;
            }

            props.onLoginSuccess?.(data);
        }
    }});

    const doLogin = (): void => {
        if(!username) {
            setUsernameError(true);
        }

        if(!password) {
            setPasswordError(true);
        }

        if(!username || !password) {
            return;
        }

        doLoginMutation.execute({username, password});
    };

    return <div className="flex justify-center items-center w-[100vw] h-[100vh]">
        <Card className="max-w-md w-full" elevation={2}>
            <form className="flex flex-col gap-2 p-4" onSubmit={e => {
                e.preventDefault();
                doLogin();
            }}>
                <TextField
                    error={Boolean(loginError) || usernameError}
                    type="text"
                    value={username}
                    onChange={e => {
                        if(e.target.value) {
                            setUsernameError(false);
                        }

                        setUsername(e.target.value);
                    }}
                    autoComplete="username"
                    label="Username"
                />

                <TextField
                    error={Boolean(loginError) || passwordError}
                    type="password"
                    value={password}
                    onChange={e => {
                        if(e.target.value) {
                            setPasswordError(false);
                        }
                        setPassword(e.target.value);
                    }}
                    autoComplete="password"
                    label="Password"
                />

                <Button
                    color={Boolean(loginError) ? "error" : "primary"}
                    variant="outlined"
                    className={`login-input ${username && password ? "valid" : "invalid"}`}
                    type="submit"
                >Login</Button>

                {loginError && <Alert color="error" severity="error" className="error-alert">{loginError}</Alert>}
            </form>
        </Card>
    </div>;
}
