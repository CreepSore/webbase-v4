import AuthenticationParameter from "@extensions/Core.OAuth2/enums/AuthenticationParameter";
import { PasswordAuthenticationData } from "@extensions/Core.OAuth2/interfaces/AuthenticationData";
import React from "react";
import ReactDOM from "react-dom/client";

import "./style.css";

function Main(): JSX.Element {
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [loginError, setLoginError] = React.useState("");

    const doLogin = (): void => {
        (async() => {
            const fetchResponse = await fetch(location.href, {
                method: "POST",
                body: JSON.stringify({
                    type: AuthenticationParameter.Password,
                    name: username,
                    password,
                } as PasswordAuthenticationData),
                headers: {
                    "Content-Type": "application/json",
                },
            });
            const jsonData = await fetchResponse.json();

            if(fetchResponse.status === 400) {
                setLoginError(jsonData.error);
            }
            else if(fetchResponse.status === 302) {
                window.location.href = fetchResponse.headers.get("Location") as string;
            }
        })();
    };

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
                onClick={() => doLogin()}
            >Login</button>
        </div>
    </div>;
}

window.addEventListener("load", () => {
    ReactDOM.createRoot(document.querySelector("#react-container") as Element).render(<Main />);
});

