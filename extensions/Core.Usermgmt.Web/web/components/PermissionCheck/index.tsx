import * as React from "react";
import { useContext } from "react";
import MeContext from "../me-provider/MeContext";
import { PermissionEntry } from "@extensions/Core.Usermgmt/permissions";

interface PermissionCheckProperties {
    permissions: Array<string|PermissionEntry>|Array<string[]|PermissionEntry[]>;
}

/**
 * This component has to have a MeContext for it to work.
 */
export default function PermissionCheck(props: React.PropsWithChildren<PermissionCheckProperties>): React.ReactElement {
    const me = useContext(MeContext);
    const hasPermissions = React.useMemo(() => {
        if(Array.isArray(props.permissions[0])) {
            // ! WTF?
            // @ts-ignore
            return props.permissions.some((permissions: string[]|PermissionEntry[]) => {
                return permissions.every(p => {
                    return me.hasPermission(typeof p === "string" ? p : p.name);
                });
            });
        }

        return props.permissions.every((p: string|PermissionEntry) => {
            return me.hasPermission(typeof p === "string" ? p : p.name);
        });
    }, [props.permissions, me?.me]);

    if(hasPermissions) {
        return <>{props.children}</>;
    }

    return <></>;
}
