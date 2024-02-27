import * as React from "react";
import { useContext } from "react";
import MeContext from "../me-provider/MeContext";
import { PermissionEntry } from "@extensions/Core.Usermgmt/permissions";

interface PermissionCheckProperties {
    permissions: Array<string|PermissionEntry>;
}

/**
 * This component has to have a MeContext for it to work.
 */
export default function PermissionCheck(props: React.PropsWithChildren<PermissionCheckProperties>): JSX.Element {
    const me = useContext(MeContext);
    const hasPermissions = React.useMemo(() => props.permissions.every(p => me.hasPermission(p)), [props.permissions, me?.me]);

    if(hasPermissions) {
        return <>{props.children}</>;
    }

    return <></>;
}
