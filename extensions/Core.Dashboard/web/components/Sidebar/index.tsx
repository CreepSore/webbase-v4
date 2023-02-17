import * as React from "react";
import { useMutation } from "../../../../Core.GraphQL/web/GraphQLHooks";
import ILogonStateManager from "../../interfaces/ILogonStateManager";
import INavigator from "../../interfaces/INavigator";

import "./style.css";


interface SidebarProps extends INavigator, ILogonStateManager {
    activePage: string;
    isLoggedIn: boolean;
}

export default function Sidebar(props: SidebarProps) {
    const doLogoutMutation = useMutation(`mutation {
        logout
    }`, {onSuccess: (data: string, errors) => {
        props.onLogout?.();
    }});

    return props.isLoggedIn ? <div className="dashboard-sidebar">
        <button onClick={() => props.onNavigationRequest("home")}><p>Home</p></button>
        <button onClick={() => props.onNavigationRequest("users")}><p>Users</p></button>
        <button onClick={() => props.onNavigationRequest("permissions")}><p>Permissions</p></button>
        <button onClick={() => doLogoutMutation.execute()}>Logout</button>
    </div> : <></>;
}

