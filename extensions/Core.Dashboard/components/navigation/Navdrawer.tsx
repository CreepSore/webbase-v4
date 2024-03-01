import * as React from "react";

import { Button, Drawer, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import NavigatorContext from "@extensions/Core.React/Navigator/NavigatorContext";
import PermissionCheck from "@extensions/Core.Usermgmt.Web/web/components/PermissionCheck";
import Permissions from "@extensions/Core.Usermgmt/permissions";

interface NavdrawerProperties {
    open: boolean;
    onClose: () => void;
}

export default function Navdrawer(props: NavdrawerProperties): JSX.Element {
    const navigator = React.useContext(NavigatorContext);

    return <Drawer
        anchor="left"
        open={props.open}
        onClose={() => props.onClose()}
    >
        <div className="flex w-full justify-end p-2">
            <IconButton onClick={() => props.onClose()}><CloseIcon /></IconButton>
        </div>

        <div className="flex flex-col">
            <PermissionCheck permissions={[Permissions.USERS.VIEW]}><Button size="large" onClick={() => navigator.doNavigationRequest("users", {})}>Users</Button></PermissionCheck>
            <PermissionCheck permissions={[Permissions.PERMISSIONS.VIEW]}><Button size="large" onClick={() => navigator.doNavigationRequest("permissions", {})}>Permissions</Button></PermissionCheck>
        </div>
    </Drawer>;
}
