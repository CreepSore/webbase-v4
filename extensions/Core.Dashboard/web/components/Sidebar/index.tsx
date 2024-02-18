import * as React from "react";
import { useMutation, useQuery } from "@extensions/Core.GraphQL/web/GraphQLHooks";
import ILogonStateManager from "../../interfaces/ILogonStateManager";
import INavigator from "../../interfaces/INavigator";

import UsermgmtPermissions from "@extensions/Core.Usermgmt.Web/permissions";
import DashboardPermissions from "@extensions/Core.Dashboard/permissions";
import "./style.css";
import { Button, Paper } from "@mui/material";

interface SidebarButtonProps {
    label: string;
    active?: boolean;
    onClick?: () => void;
}

function SidebarButton(props: SidebarButtonProps): JSX.Element {
    return <Button
        variant="outlined"
        color="success"
        className={props.active === true ? "active" : ""}
        onClick={() => props.onClick?.()}
    ><p>{props.label}</p></Button>;
}

interface SidebarNavigationButtonProps extends INavigator {
    pageKey: string;
    activePage: string;
    label: string;
}

function SidebarNavigationButton(props: SidebarNavigationButtonProps): JSX.Element {
    return <Button
        variant="outlined"
        color="success"
        className={props.activePage === props.pageKey ? "active" : ""}
        onClick={() => {
            props.onNavigationRequest(props.pageKey);
        }}
    ><p>{props.label}</p></Button>;
}

interface SidebarRegisteredPagesProps {
    pages: { id: string, name: string, href: string, neededPermissions: string[] }[];
}

function SidebarRegisteredPages(props: SidebarRegisteredPagesProps): JSX.Element {
    const [menuOpen, setMenuOpen] = React.useState(false);
    const menuRef = React.useRef<HTMLDivElement>(null);
    const [menuX, setMenuX] = React.useState(0);
    const [menuY, setMenuY] = React.useState(0);

    React.useEffect(() => {
        if(!menuRef.current) return;

        menuRef.current.style.left = `${menuX}px`;
        menuRef.current.style.top = `${menuY}px`;
    }, [menuRef.current, menuX, menuY]);

    return <>
        {props.pages.length > 0 && <button
            onClick={e => {
                if(!menuOpen) {
                    setMenuX(e.clientX);
                    setMenuY(e.clientY);
                }

                setMenuOpen(!menuOpen);
            }}
        ><p>Views</p></button>}

        <Paper
            className={`fixed ${menuOpen ? "block" : "hidden"} min-w-[200px] max-w-[80%]`}
            ref={menuRef}
        >
            {props.pages.map(page => <button
                className="bg-black w-full text-center"
                key={page.id}
                onClick={() => (location.href = page.href)}
            >{page.name}</button>)}
        </Paper>
    </>;
}

interface DashboardPage {
    id: string;
    name: string;
    href: string;
    neededPermissions: string[];
}

interface SidebarProps extends INavigator, ILogonStateManager {
    activePage: string;
    isLoggedIn: boolean;
    myPermissions: string[];
}

export default function Sidebar(props: SidebarProps): JSX.Element {
    const menuRef = React.useRef<HTMLDivElement>(null);
    const [pages, setPages] = React.useState<DashboardPage[]>([]);

    const doLogoutMutation = useMutation(`mutation {
        logout
    }`, {onSuccess: (data: string, errors) => {
        props.onLogout?.();
    }});

    useQuery<{pages: DashboardPage[]}>("{ pages { id, name, href, neededPermissions } }", {onSuccess: (data: {pages: DashboardPage[]}, errors) => {
        setPages(data.pages);
    }});

    return props.isLoggedIn ? <>
        <button className="fixed top-0 left-0 z-50 xl:hidden text-white p-2 bg-black/10" onClick={() => menuRef.current?.classList?.toggle?.("flex")}>M</button>
        <div className="dashboard-sidebar flex flex-col gap-2" ref={menuRef}>
            <SidebarNavigationButton pageKey={"home"} label={"Home"} activePage={props.activePage} onNavigationRequest={props.onNavigationRequest} />
            {props.myPermissions.includes(UsermgmtPermissions.ViewUser.name)
                && <SidebarNavigationButton pageKey="users" label="Users" activePage={props.activePage} onNavigationRequest={props.onNavigationRequest} />}
            {props.myPermissions.includes(UsermgmtPermissions.ViewPermissions.name)
                && <SidebarNavigationButton pageKey="permissions" label="Permissions" activePage={props.activePage} onNavigationRequest={props.onNavigationRequest} />}
            {props.myPermissions.includes(DashboardPermissions.ViewLogs.name)
                && <SidebarNavigationButton pageKey="logs" label="Logs" activePage={props.activePage} onNavigationRequest={props.onNavigationRequest} />}

            <SidebarRegisteredPages
                pages={pages}
            />

            <SidebarButton label="Logout" onClick={() => doLogoutMutation.execute()} />
        </div>
    </> : <></>;
}
