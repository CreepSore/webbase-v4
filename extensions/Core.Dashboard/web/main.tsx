import React from "react";
import ReactDOM from "react-dom/client";

import Router from "../../Core.ReactComponents/Router";
import RouterPage from "../../Core.ReactComponents/Router/RouterPage";

import {useQuery} from "../../Core.GraphQL/web/GraphQLHooks";

// @ts-ignore
import backgroundImageSrc from "./bg.png";

import "./style.css";
import Sidebar from "./components/Sidebar";
import IUser from "../../Core.Usermgmt/Interfaces/ModelTypes";
import LoginPage from "./pages/LoginPage";
import UsersPage from "./pages/UsersPage";
import PermissionsPage from "./pages/PermissionsPage";
import LogsPage from "./pages/LogsPage";

function Main() {
    let startPage = location.hash.substring(1);
    let [currentDashboardPage, setCurrentDashboardPage] = React.useState(startPage || "home");
    let [myUser, setMyUser] = React.useState<IUser>();    

    let myUserQuery = useQuery<{me: IUser}>(
        `{ me { pseudo, id, username, email, permissionGroup { name, permissions { name } } } }`,
        {onSuccess: (data) => {
            if(data.me.pseudo) {
                setCurrentDashboardPage("login");
            }
            setMyUser(data.me);
        }}
    );

    let onNavigationRequest = (target: string) => {
        if(target === currentDashboardPage) return;
        window.history.pushState(null, "", target !== "home" ? `#${target}` : "#");

        setCurrentDashboardPage(target);
    }

    if(myUserQuery.loading) {
        return <></>;
    }

    return <div id="dashboard">
        <div className="background">
            <div className="background-container">
                <div className="image" style={{backgroundImage: `url(${backgroundImageSrc})`}}/>
                <div className="blur"></div>
            </div>
        </div>
        <div id="dashboard-content">
            <Sidebar
                activePage={currentDashboardPage}
                onNavigationRequest={onNavigationRequest}
                isLoggedIn={!myUser?.pseudo}
                onLogout={() => myUserQuery.forceUpdate()}
                myPermissions={(myUser?.permissionGroup?.permissions || []).map(p => p.name)}/>

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
    </div>;
}

window.addEventListener("load", () => {
    ReactDOM.createRoot(document.querySelector("#react-container") as Element).render(<Main />);
});

