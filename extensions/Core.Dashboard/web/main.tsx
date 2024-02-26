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

import "./style.css";
import useMe from "@extensions/Core.Usermgmt.Web/web/hooks/useMe";
import Loader from "@extensions/Core.React/Loader/Loader";
import HomePage from "../pages/HomePage";
import UsermgmtWebApi from "@extensions/Core.Usermgmt.Web/web/UsermgmtWebApi";
import MeContext from "@extensions/Core.Usermgmt.Web/web/components/me-provider/MeContext";
import UsersPage from "../pages/UsersPage";

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

    const me = useMe();

    React.useEffect(() => {
        if(!me.me) {
            return;
        }

        if(me.me.username === "Anonymous") {
            UsermgmtWebApi.startLoginProcess(location.href);
            return;
        }

        navigator.forceCurrentPage("home");
    }, [me.me]);

    return <ThemeProvider theme={theme}>
        <NavigatorContext.Provider value={navigator}>
            <MeContext.Provider value={me}>
                <Router currentPage={navigator.currentPage}>
                    <RouterPage key="init">
                        <Loader />
                    </RouterPage>

                    <RouterPage key="home">
                        <HomePage />
                    </RouterPage>

                    <RouterPage key="users">
                        <UsersPage />
                    </RouterPage>
                </Router>
            </MeContext.Provider>
        </NavigatorContext.Provider>
    </ThemeProvider>;
}

window.addEventListener("load", () => {
    document.title = "Dashboard";
    ReactDOM.createRoot(document.querySelector("#react-container") as Element).render(<Main />);
});

