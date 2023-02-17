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

function Main() {
    let startPage = location.hash.substring(1);
    let [currentDashboardPage, setCurrentDashboardPage] = React.useState(startPage || "home");
    let myUserQuery = useQuery<{me: IUser}>(
        `{ me { pseudo, id, username, email, permissionGroup { name, permissions { name } } } }`,
        {onSuccess: (data) => setMyUser(data.me)}
    );
    let [myUser, setMyUser] = React.useState<IUser>();

    let onNavigationRequest = (target: string) => {
        if(target === currentDashboardPage) return;
        window.history.pushState(null, "", target !== "home" ? `#${target}` : "/");

        setCurrentDashboardPage(target);
    }

    React.useEffect(() => {
        if(myUser?.pseudo) {
            if(currentDashboardPage !== "login") {
                setCurrentDashboardPage("login");
            }
        }
        else {
            setCurrentDashboardPage("home");
        }
    }, [myUser]);

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
                onLogout={() => myUserQuery.forceUpdate()}/>

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
                    />
                </RouterPage>

                <RouterPage key="permissions">

                </RouterPage>
            </Router>
        </div>
    </div>;
}

window.addEventListener("load", () => {
    ReactDOM.createRoot(document.querySelector("#react-container") as Element).render(<Main />);
});

