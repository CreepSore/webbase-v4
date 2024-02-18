import React from "react";
import ReactDOM from "react-dom/client";

import "./style.css";
import { ThemeProvider } from "@emotion/react";
import { createTheme } from "@mui/material";
import Router from "@extensions/Core.React/Router";
import RouterPage from "@extensions/Core.React/Router/RouterPage";
import useNavigationHandler from "@extensions/Core.React/Navigator/useNavigationHandler";
import NavigationKeys from "./NavigationKeys";
import NavigatorContext from "@extensions/Core.React/Navigator/NavigatorContext";
import LoginPage from "../pages/LoginPage";

import "./style.css";
import useMe from "@extensions/Core.Usermgmt.Web/web/hooks/useMe";
import Loader from "@extensions/Core.React/Loader/Loader";
import HomePage from "../pages/HomePage";

function Main(): JSX.Element {
    const navigator = useNavigationHandler<NavigationKeys>({
        defaultPage: "init",
        shouldHandleNavigationRequest: (key, args) => {
            if(key === "logout") {
                return false;
            }

            return true;
        },
    });

    const theme = createTheme({
        palette: {
            mode: "dark",
        },
    });

    const [me, updateMe] = useMe();

    React.useEffect(() => {
        if(me) {
            if(me.username === "Anonymous") {
                navigator.forceCurrentPage("login");
                return;
            }

            navigator.forceCurrentPage("home");
        }
    }, [me]);

    return <ThemeProvider theme={theme}>
        <NavigatorContext.Provider value={navigator}>
            <Router currentPage={navigator.currentPage}>
                <RouterPage key="init">
                    <Loader />
                </RouterPage>

                <RouterPage key="login">
                    <LoginPage
                        onLoginSucceeded={() => {
                            updateMe();
                            navigator.forceCurrentPage("home");
                        }}
                    />
                </RouterPage>

                <RouterPage key="home">
                    <HomePage />
                </RouterPage>
            </Router>
        </NavigatorContext.Provider>
    </ThemeProvider>;
}

window.addEventListener("load", () => {
    ReactDOM.createRoot(document.querySelector("#react-container") as Element).render(<Main />);
});

