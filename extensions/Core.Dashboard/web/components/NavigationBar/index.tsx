import React from "react";

interface NavigationBarProperties {
    activePage: string;
    onNavigation(page: string);
}

export default function NavigationBar(props: NavigationBarProperties) {
    let pages = [
        {key: "home", title: "Home"},
        {key: "users", title: "Users"},
        {key: "permissions", title: "Permissions"}
    ];

    return <div className="p-2 flex items-center bg-blue-400 gap-2">
        {pages.map(nav => <button className={`${props.activePage === nav.key ? "text-white" : "text-slate-300"} hover:text-white`} key={nav.key} onClick={() => props.onNavigation(nav.key)}>{nav.title}</button>)}
    </div>;
}
