import React from "react";
import ReactDOM from "react-dom/client";

import Router from "@extensions/Core.ReactComponents/Router";
import RouterPage from "@extensions/Core.ReactComponents/Router/RouterPage";

import {useQuery} from "@extensions/Core.GraphQL/web/GraphQLHooks";

// @ts-ignore
import backgroundImageSrc from "./bg.png";

import "./style.css";
import Sidebar from "./components/Sidebar";
import IUser from "@extensions/Core.Usermgmt/Interfaces/ModelTypes";

import LoginPage from "./pages/LoginPage";
import UsersPage from "./pages/UsersPage";
import PermissionsPage from "./pages/PermissionsPage";
import LogsPage from "./pages/LogsPage";

import Notifications from "@extensions/Core.ReactComponents/Notifications";
import NotificationManager from "@extensions/Core.ReactComponents/Notifications/NotificationManager";
import CookieDialog from "@extensions/Core.ReactComponents/Cookies/CookieDialog";

function Main(): JSX.Element {
    const startPage = location.hash.substring(1);
    const [currentDashboardPage, setCurrentDashboardPage] = React.useState(startPage || "home");
    const [myUser, setMyUser] = React.useState<IUser>();
    const [cookieDialogVisible, setCookieDialogVisible] = React.useState<boolean>(true);

    const myUserQuery = useQuery<{me: IUser}>(
        "{ me { pseudo, id, username, email, permissionGroup { name, permissions { name } } } }",
        {onSuccess: (data) => {
            if(data.me.pseudo) {
                setCurrentDashboardPage("login");
            }
            setMyUser(data.me);
        }},
    );

    React.useEffect(() => {
        NotificationManager.addNotification({
            type: "info",
            message: "text",
            title: "test",
        });
    }, []);

    const onNavigationRequest = (target: string): void => {
        if(target === currentDashboardPage) return;
        window.history.pushState(null, "", target !== "home" ? `#${target}` : "#");

        setCurrentDashboardPage(target);
    };

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
                onLogout={() => {
                    myUserQuery.forceUpdate();
                    setCurrentDashboardPage("home");
                }}

                myPermissions={(myUser?.permissionGroup?.permissions || []).map(p => p.name)}/>

            {cookieDialogVisible && <CookieDialog
                cookieTypes={[
                    {key: "mandatory", label: "Mandatory", checked: true, isFixedValue: true},
                ]}

                onCookiesAccepted={(accepted: string[]) => {
                    console.log(accepted);
                    setCookieDialogVisible(false);
                }}

                onCookiesDeclined={() => {
                    console.log("DECLINED");
                    setCookieDialogVisible(false);
                }}
            >
                <p>To provide our services we use cookies to save mandatory data.</p>
                <p className="mt-4">We save:</p>
                <ul className="ml-4 mb-4">
                    <li>Login Sessions</li>
                    <li>Your IP Address for Firewall purposes</li>
                </ul>
                <p>We will never provide your data to any third-party-services.</p>
                <p>We don't save any data for marketing purposes, since we don't show any ads.</p>
            </CookieDialog>}

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
                    <Notifications />
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

