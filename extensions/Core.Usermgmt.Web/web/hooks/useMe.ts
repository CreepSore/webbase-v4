import * as React from "react";
import IUser from "@extensions/Core.Usermgmt/types/IUser";
import UsermgmtWebApi from "../UsermgmtWebApi";
import IPermission from "@extensions/Core.Usermgmt/types/IPermission";
import Permissions, { PermissionEntry } from "@extensions/Core.Usermgmt/permissions";

export default function useMe(): {me: IUser, update: () => void, hasPermission: (key: string|PermissionEntry) => boolean, isLoading: boolean} {
    const [loading, setLoading] = React.useState(true);
    const [currentMe, setCurrentMe] = React.useState<IUser>(null);

    const permissions = React.useMemo<IPermission[]>(() => {
        if(!currentMe) return [];

        return (currentMe.groups || [])
            .map(g => g.permissions)
            .filter(Boolean)
            .flat(1);
    }, [currentMe]);

    const hasWildcardPermission = React.useMemo<boolean>(() => {
        return (permissions || []).some(p => p.name === Permissions.ALL.name);
    }, [permissions]);

    const update = (force: boolean = false): void => {
        if(loading && !force) {
            return;
        }

        setLoading(true);

        UsermgmtWebApi.me()
            .then(me => {
                setLoading(false);
                setCurrentMe(me);
            });
    };

    const hasPermission = (name: string|PermissionEntry): boolean => {
        if(hasWildcardPermission) return true;

        return (permissions || []).some(p => p.name === (typeof name === "string" ? name : name.name));
    };

    React.useEffect(() => {
        update(true);
    }, []);

    return {me: currentMe, update, hasPermission, isLoading: loading};
}
