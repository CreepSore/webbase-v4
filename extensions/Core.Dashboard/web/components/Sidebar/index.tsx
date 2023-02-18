import * as React from "react";
import { useMutation } from "../../../../Core.GraphQL/web/GraphQLHooks";
import ILogonStateManager from "../../interfaces/ILogonStateManager";
import INavigator from "../../interfaces/INavigator";

import UsermgmtPermissions from "@extensions/Core.Usermgmt.Web/permissions";
import DashboardPermissions from "@extensions/Core.Dashboard/permissions";
import "./style.css";

interface SidebarButtonProps {
    label: string;
    active?: boolean;
    onClick?: () => void;
}

function SidebarButton(props: SidebarButtonProps) {
    return <button
        className={props.active === true ? "active" : ""}
        onClick={() => props.onClick?.()}
    ><p>{props.label}</p></button>
}

interface SidebarNavigationButtonProps extends INavigator {
    pageKey: string;
    activePage: string;
    label: string;
}

function SidebarNavigationButton(props: SidebarNavigationButtonProps) {
    return <button
        className={props.activePage === props.pageKey ? "active" : ""}
        onClick={() => {
            props.onNavigationRequest(props.pageKey);
        }}
    ><p>{props.label}</p></button>
}

interface SidebarProps extends INavigator, ILogonStateManager {
    activePage: string;
    isLoggedIn: boolean;
    myPermissions: string[];
}

export default function Sidebar(props: SidebarProps) {
    const doLogoutMutation = useMutation(`mutation {
        logout
    }`, {onSuccess: (data: string, errors) => {
        props.onLogout?.();
    }});

    return props.isLoggedIn ? <div className="dashboard-sidebar">
        <SidebarNavigationButton pageKey={"home"} label={"Home"} activePage={props.activePage} onNavigationRequest={props.onNavigationRequest} />
        {props.myPermissions.includes(UsermgmtPermissions.ViewUser.name) && <SidebarNavigationButton pageKey="users" label="Users" activePage={props.activePage} onNavigationRequest={props.onNavigationRequest} />}
        {props.myPermissions.includes(UsermgmtPermissions.ViewPermissions.name) && <SidebarNavigationButton pageKey="permissions" label="Permissions" activePage={props.activePage} onNavigationRequest={props.onNavigationRequest} />}
        {props.myPermissions.includes(DashboardPermissions.ViewLogs.name) && <SidebarNavigationButton pageKey="logs" label="Logs" activePage={props.activePage} onNavigationRequest={props.onNavigationRequest} />}
        <SidebarButton label="Logout" onClick={() => doLogoutMutation.execute()} />
    </div> : <></>;
}

