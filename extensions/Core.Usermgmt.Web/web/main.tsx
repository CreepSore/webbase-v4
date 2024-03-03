import React from "react";
import ReactDOM from "react-dom/client";

import "./style.scss";
import { ThemeProvider } from "@emotion/react";
import { createTheme } from "@mui/material";

import LoginPage from "./pages/login/LoginPage";

function Main(): JSX.Element {
    const theme = createTheme({
        palette: {
            mode: "dark",
        },
    });

    React.useEffect(() => {
        const url = new URL(location.href);
        if(!url.searchParams.has("redirect_uri")) {
            url.searchParams.set("redirect_uri", "/");
            window.history.pushState({path: url.href}, "", url.href);
            return;
        }
    }, []);

    return <ThemeProvider theme={theme}>
        <LoginPage
            onLogin={me => {
                const url = new URL(location.href);
                location.href = url.searchParams.get("redirect_uri");
            }}
        />
    </ThemeProvider>;
}

window.addEventListener("load", () => {
    document.title = "Login";
    ReactDOM.createRoot(document.querySelector("#react-container") as Element).render(<Main />);
});

