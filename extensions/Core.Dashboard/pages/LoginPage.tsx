import * as React from "react";
import { Alert, Button, Card, CardContent, CardHeader, Paper, TextField } from "@mui/material";

import NavigatorContext from "@extensions/Core.React/Navigator/NavigatorContext";
import FullNavigator from "@extensions/Core.React/Navigator/FullNavigator";
import UsermgmtWebApi from "@extensions/Core.Usermgmt.Web/web/UsermgmtWebApi";

interface LoginPageProperties {
    onLoginSucceeded?: () => void;
}

export default function LoginPage(props: LoginPageProperties): JSX.Element {
    const navigator = React.useContext<FullNavigator<"login", {username: string, password: string}>>(NavigatorContext);

    const [username, setUsername] = React.useState(navigator.currentArguments?.username || "");
    const [password, setPassword] = React.useState(navigator.currentArguments?.password || "");
    const [loginError, setLoginError] = React.useState("");

    React.useEffect(() => {
        navigator.updateCurrentArguments({
            ...navigator.currentArguments,
            username,
            password,
        });
    }, [username, password]);

    const doLogin = (): void => {
        UsermgmtWebApi.login({
            type: "password",
            username,
            password,
        }).then(data => {
            if(!data.success) {
                setLoginError(data.error);
                return;
            }

            props.onLoginSucceeded?.();
        });
    };

    return <Paper className="min-w-[100vw] min-h-[100vh] flex justify-center items-center" square>
        <Paper variant="outlined">
            <CardHeader title={<h1 className="text-xl font-thin my-0">Login</h1>}/>

            <CardContent>
                <form
                    className="flex flex-col gap-2"
                    onSubmit={e => {
                        e.preventDefault();
                        doLogin();
                    }}
                >
                    {loginError && <Alert color="error" severity="error">{loginError}</Alert>}

                    <TextField
                        label="Username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        size="small"
                    />

                    <TextField
                        label="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        size="small"
                        type="password"
                    />

                    <Button
                        type="submit"
                        color="success"
                        variant="outlined"
                    >Login</Button>
                </form>
            </CardContent>
        </Paper>
    </Paper>;
}

