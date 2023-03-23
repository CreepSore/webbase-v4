import { useMutation } from "@extensions/Core.GraphQL/web/GraphQLHooks";
import React from "react";


import "./style.css";

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
    const doLoginMutation = useMutation(`mutation Login($username: String!, $password: String!) {
        loginByCredentials(username:$username, password:$password)
    }`, {onSuccess: (data: string, errors) => {
        if(errors?.length > 0) {
            setLoginError(errorMapping[errors[0].message] || errors[0].message);
        }
        else {
            setLoginError("");
            props.onLoginSuccess?.(data);
        }
    }});

    return <div id="login">
        <div className="login-form">
            <input
                type="text"
                className={`login-input ${username ? "valid" : "invalid"}`}
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username" />
            <input
                type="password"
                className={`login-input ${password ? "valid" : "invalid"}`}
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password" />
            {loginError && <p className="error-alert">{loginError}</p>}
            <button
                className={`login-input ${username && password ? "valid" : "invalid"}`}
                onClick={() => doLoginMutation.execute({username, password})}
            >Login</button>
        </div>
    </div>;
}
