import React from "react";
import ReactDOM from "react-dom/client";

import Router from "@extensions/Core.ReactComponents/Router";
import RouterPage from "@extensions/Core.ReactComponents/Router/RouterPage";

import {useQuery} from "@extensions/Core.GraphQL/web/GraphQLHooks";

// @ts-ignore
// import backgroundImageSrc from "./bg.png";

import "./style.css";
import Sidebar from "./components/Sidebar";
import IUser from "@extensions/Core.Usermgmt/Interfaces/ModelTypes";

import LoginPage from "./pages/LoginPage";
import UsersPage from "./pages/UsersPage";
import PermissionsPage from "./pages/PermissionsPage";
import LogsPage from "./pages/LogsPage";
import { Paper, ThemeProvider, createTheme } from "@mui/material";
import { ThemeContext } from "@emotion/react";

function Main(): JSX.Element {
    const startPage = location.hash.substring(1);
    const [currentDashboardPage, setCurrentDashboardPage] = React.useState(startPage || "home");
    const [myUser, setMyUser] = React.useState<IUser>();
    const theme = createTheme({
        palette: {
            mode: "dark",
        },
    });

    const myUserQuery = useQuery<{me: IUser}>(
        "{ me { pseudo, id, username, email, permissionGroup { name, permissions { name } } } }",
        {onSuccess: (data) => {
            if(data.me.pseudo) {
                setCurrentDashboardPage("login");
            }
            setMyUser(data.me);
        }},
    );

    const onNavigationRequest = (target: string): void => {
        if(target === currentDashboardPage) return;
        window.history.pushState(null, "", target !== "home" ? `#${target}` : "#");

        setCurrentDashboardPage(target);
    };

    if(myUserQuery.loading) {
        return <></>;
    }

    return <ThemeProvider theme={theme}>
        <Paper id="dashboard">
            <div id="dashboard-content">
                <Sidebar
                    activePage={currentDashboardPage}
                    onNavigationRequest={onNavigationRequest}
                    isLoggedIn={!myUser?.pseudo}
                    onLogout={() => {
                        myUserQuery.forceUpdate();
                        setCurrentDashboardPage("home");
                    }}

                    myPermissions={(myUser?.permissionGroup?.permissions || []).map(p => p.name)}
                />

                <Router currentPage={currentDashboardPage}>
                    <RouterPage key="login">
                        <LoginPage
                            onLoginSuccess={() => {
                                myUserQuery.forceUpdate();
                                setCurrentDashboardPage("home");
                            }}
                            onLoginFailure={() => {
                                console.log("FAILURE");
                            }}
                        />
                    </RouterPage>

                    <RouterPage key="home">
                        <></>
                    </RouterPage>

                    <RouterPage key="users">
                        <UsersPage
                            myUser={myUser}
                            afterImpersonate={() => {
                                myUserQuery.forceUpdate();
                                setCurrentDashboardPage("home");
                            }}
                        />
                    </RouterPage>

                    <RouterPage key="permissions">
                        <PermissionsPage />
                    </RouterPage>

                    <RouterPage key="logs">
                        <LogsPage />
                    </RouterPage>
                </Router>
            </div>
        </Paper>
    </ThemeProvider>;
}

window.addEventListener("load", () => {
    ReactDOM.createRoot(document.querySelector("#react-container") as Element).render(<Main />);
});

