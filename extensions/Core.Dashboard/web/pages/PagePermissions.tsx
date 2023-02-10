import React from "react";
import NavigationBar from "../components/NavigationBar";
import PermissionsView from "../components/PermissionsView";

interface PagePermissionsProperties {
    setCurrentPage: (key: string) => void;
}

export default function PagePermissions(props: PagePermissionsProperties) {
    return <div className="flex flex-col min-h-screen bg-slate-800 text-slate-400">
        <NavigationBar
            activePage="permissions"
            onNavigation={newPage => props.setCurrentPage(newPage)}
        />

        <PermissionsView />
    </div>;
}
