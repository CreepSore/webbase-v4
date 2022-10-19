import React from "react";
import NavigationBar from "../components/NavigationBar";
import PermissionsView from "../components/PermissionsView";

interface PagePermissionsProperties {
    setCurrentPage(key: string);
}

export default function PagePermissions(props: PagePermissionsProperties) {
    return <div className="flex flex-col">
        <NavigationBar
            activePage="permissions"
            onNavigation={newPage => props.setCurrentPage(newPage)}
        />

        <PermissionsView />
    </div>;
}
