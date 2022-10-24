import React from "react";

import UsermgmtPermissions from "../../../../Core.Usermgmt.Web/permissions";
import DashboardPermission from "../../../permissions";

import {usePermissions, invalidateLogonInfo, useLogonInfo, useDashboardPages} from "../../hooks";

interface NavigationBarProperties {
    activePage: string;
    onNavigation: (page: string) => void;
}

interface NavButtonProperties {
    pageKey?: string,
    label: string,
    visible?: boolean,
    isActive?: boolean,
    onClick: (page: string, x: number, y: number) => void
}

function NavButton(props: NavButtonProperties) {
    let btnRef = React.useRef<HTMLButtonElement>();

    return <>
        {props.visible !== false && <button
            ref={btnRef}
            className={`${props.isActive === true ? "text-white bg-gray-800" : "text-slate-300"} hover:text-white hover:bg-gray-800 h-[2.5em] px-4`}
            onClick={e => {
                props.onClick(props.pageKey, btnRef.current.offsetLeft, btnRef.current.offsetTop);
                e.stopPropagation();
            }}>{props.label}
        </button>}
    </>;
}

interface NavMenuProperties {
    children: any;
    x: number;
    y: number;
    visible: boolean;
}

function NavMenu(props: NavMenuProperties) {
    let divRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if(!divRef || !props.visible) return;

        divRef.current.style.left = `${props.x}px`;
        divRef.current.style.top = "2.5em";
    }, [divRef, props.x, props.y, props.visible]);

    return <>
        {props.visible && <div className={`fixed z-50`} ref={divRef}>
            {props.children}
        </div>}
    </>;
}

interface NavMenuButtonProperties {
    label: string;
    onClick: () => void;
    isActive?: boolean
}

function NavMenuButton(props: NavMenuButtonProperties) {
    return <button
        className={`px-4 py-2 hover:bg-gray-800 cursor-pointer ${props.isActive === true ? "bg-gray-800" : "bg-gray-600"}`}
        onClick={() => props.onClick()}
    >{props.label}</button>;
}

export default function NavigationBar(props: NavigationBarProperties) {
    let logonInfo = useLogonInfo();
    let [viewUsers, viewPermissions, viewLogs] = usePermissions(
        UsermgmtPermissions.ViewUser.name,
        UsermgmtPermissions.ViewPermissions.name,
        DashboardPermission.ViewLogs.name
    );
    let [visibleMenu, setVisibleMenu] = React.useState("");
    let [menuX, setMenuX] = React.useState(0);
    let [menuY, setMenuY] = React.useState(0);

    let [loading, pages] = useDashboardPages();
    let customDropdownMenu = React.useMemo(() => {
        if(loading) return <></>;
        return [...new Set(pages.filter(p => Boolean(p.parentMenuTitle) && p.showInNavigation).map(p => p.parentMenuTitle))]
            .map(dropDownTitle => {
                const menuKey = `custom-menu-${dropDownTitle}`;
                const submenus = pages.filter(p => p.parentMenuTitle === dropDownTitle);

                return <React.Fragment key={menuKey}>
                    <NavMenu
                        visible={visibleMenu === menuKey} x={menuX} y={menuY}
                    >
                        <div className="text-white flex flex-col">
                            {submenus.map(submenu => <NavMenuButton
                                key={submenu.key}
                                label={submenu.label}
                                onClick={() => props.onNavigation(submenu.key)}
                                isActive={props.activePage === submenu.key}
                            />)}
                        </div>
                    </NavMenu>

                    <NavButton
                        pageKey={menuKey}
                        isActive={visibleMenu === menuKey || submenus.map(p => p.key).includes(props.activePage)}
                        onClick={(menu, x, y) => {
                            openMenu(menu, x, y);
                        }}
                        label={dropDownTitle}
                    />
                </React.Fragment>;
            });
    }, [pages, props.activePage, visibleMenu]);

    let customMenuButtons = React.useMemo(() => {
        return pages.filter(p => !p.parentMenuTitle && p.showInNavigation).map(p => <NavButton
            key={p.key}
            pageKey={p.key}
            label={p.label}
            onClick={props.onNavigation}
            isActive={props.activePage === p.key}
            visible={true}
        />);
    }, [pages]);

    React.useEffect(() => {
        let cb = () => {
            setVisibleMenu("");
        };

        window.addEventListener("click", cb);

        return () => window.removeEventListener("click", cb);
    }, []);

    const openMenu = (menu: string, x: number, y: number) => {
        if(visibleMenu) {
            setVisibleMenu("");
            return;
        }

        setMenuX(x);
        setMenuY(y);
        setVisibleMenu(menu);
    };

    if(!logonInfo) return;

    return <div className="flex items-center bg-gray-600 h-full max-h-[2.5em]">
        <NavButton
            pageKey="home"
            label="Home"
            onClick={props.onNavigation}
            isActive={props.activePage === "home"}
            visible={true}
        />

        <NavButton
            pageKey="dataMenu"
            isActive={visibleMenu === "dataMenu" || ["users", "permissions"].includes(props.activePage)}
            onClick={(menu, x, y) => {
                openMenu(menu, x, y);
            }}
            label="Views"
            visible={viewUsers || viewPermissions}
        />

        <NavMenu visible={visibleMenu === "dataMenu"} x={menuX} y={menuY}>
            <div className="text-white flex flex-col">
                {viewUsers && <NavMenuButton
                    label="Users"
                    onClick={() => props.onNavigation("users")}
                    isActive={props.activePage === "users"}
                />}

                {viewPermissions && <NavMenuButton
                    label="Permissions"
                    onClick={() => props.onNavigation("permissions")}
                    isActive={props.activePage === "permissions"}
                />}
            </div>
        </NavMenu>

        <NavButton
            pageKey="logs"
            label="Logs"
            isActive={props.activePage === "logs"}
            visible={viewLogs}
            onClick={() => props.onNavigation("logs")}
        />

        {customDropdownMenu}

        {customMenuButtons}

        {logonInfo.loggedIn && <NavButton
            pageKey="logout"
            label="Logout"
            visible={true}
            onClick={() => {
                fetch("/api/core.usermgmt/logout", {method: "POST"})
                .then(() => {
                    invalidateLogonInfo();
                    location.reload()
                });
            }}
        />}

        {!logonInfo.loggedIn && <NavButton
            pageKey="login"
            label="Login"
            visible={true}
            onClick={() => {
                props.onNavigation("login");
            }}
        />}

        {logonInfo.loggedIn && <p className="text-sm text-white/50 pl-3 select-none">Logged in as {logonInfo.user.username}</p>}
    </div>;
}
