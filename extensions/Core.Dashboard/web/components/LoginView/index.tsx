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
            if(!data.success || data.error) {
                setError(data.error);
            }
            else {
                props.onLogin();
            }
        });
    };

    return <div className="flex justify-center items-center h-screen bg-slate-500">
        <div className="flex flex-col bg-slate-600 text-slate-300 p-4 rounded shadow-md gap-2 w-full max-w-[500px]">
            <h1 className="text-xl">Login</h1>
            <input
                className="bg-slate-500 p-2 outline-solid outline-1 outline-green-200"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Username"
            />
            <input
                className="bg-slate-500 p-2 outline-solid outline-1 outline-green-200"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
            />
            <p>{error}</p>
            <button
                className={`${username && password ? "bg-green-300 text-slate-800" : "bg-red-500"} w-full py-2 transition-colors`}
                onClick={() => doLogin()}
            >Login</button>
        </div>
    </div>;
};
