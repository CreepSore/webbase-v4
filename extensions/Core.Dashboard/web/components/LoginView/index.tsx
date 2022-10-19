import React from "react";

interface LoginViewProperties {
    onLogin: () => void;
}

export default function LoginView(props: LoginViewProperties) {
    let [username, setUsername] = React.useState("");
    let [password, setPassword] = React.useState("");
    let [error, setError] = React.useState("");
    
    const doLogin = () => {
        fetch("/api/core.usermgmt/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username,
                password
            })
        }).then(res => res.json())
        .then(data => {
            if(!data.success) {
                setError("Invalid credentials");
            }
            else {
                props.onLogin();
            }
        });
    };

    return <div>
        <input type="text" value={username} onChange={e => setUsername(e.target.value)} />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <p>{error}</p>
        <button onClick={() => doLogin()}>Login</button>
    </div>;
};
