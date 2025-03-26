import * as React from "react";

import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";


import CloseIcon from "@mui/icons-material/Close";
import NavigatorContext from "@extensions/Core.React/Navigator/NavigatorContext";
import PermissionCheck from "@extensions/Core.Usermgmt.Web/web/components/PermissionCheck";
import Permissions from "@extensions/Core.Usermgmt/permissions";
import { House, Person, Security } from "@mui/icons-material";

type NavigatorButtonProperties = {
    navKey: string;
    navArgs?: any;

    label: string;

    startIcon?: React.ReactNode;
    endIcon?: React.ReactNode;
};

function NavigationButton({label, navKey, navArgs, startIcon, endIcon}: NavigatorButtonProperties): React.ReactElement {
    const navigator = React.useContext(NavigatorContext);

    return <Button
        className="!text-left"
        size="large"
        onClick={() => navigator.doNavigationRequest(navKey, navArgs)}
        startIcon={startIcon}
        endIcon={endIcon}
        disabled={navigator.currentPage === navKey}
    >{label}</Button>;
}

interface NavdrawerProperties {
    open: boolean;
    onClose: () => void;
}

export default function Navdrawer(props: NavdrawerProperties): JSX.Element {
    return <Drawer
        anchor="left"
        open={props.open}
        onClose={() => props.onClose()}
    >
        <div className="flex w-full justify-end p-2">
            <IconButton onClick={() => props.onClose()}><CloseIcon /></IconButton>
        </div>

        <div className="flex flex-col !min-w-[250px]">
            <NavigationButton
                label="Home"
                navKey="home"
                startIcon={<House />}
            />

            <PermissionCheck permissions={[Permissions.USERS.VIEW]}>
                <NavigationButton
                    label="Users"
                    navKey="users"
                    startIcon={<Person />}
                />
            </PermissionCheck>

            <PermissionCheck permissions={[Permissions.PERMISSIONS.VIEW]}>
                <NavigationButton
                    label="Permissions"
                    navKey="permissions"
                    startIcon={<Security />}
                />
            </PermissionCheck>
        </div>
    </Drawer>;
}
