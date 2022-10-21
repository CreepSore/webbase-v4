import React from "react";
import Permission from "../../Core.Usermgmt/Models/Permission";
import User from "../../Core.Usermgmt/Models/User";

export function useFetchJson<T>(url: string, options: RequestInit | undefined = undefined) : [boolean, T|null, () => void] {
    let [data, setData] = React.useState<T|null>(null);
    let [loading, setLoading] = React.useState(true);

    let update = () => {
        setLoading(true);
    }

    React.useEffect(() => {
        if(!loading) return;

        fetch(url, options)
            .then(r => r.json())
            .then(data => {
                setData(data);
                setLoading(false);
            })
    }, [loading]);

    return [loading, data, update];
}

export function useLocalStorage<T>(key: string) {
    let [value, setValue] = React.useState(JSON.parse(window.localStorage.getItem(key)));

    let osv = setValue;
    setValue = (data) => {
        window.localStorage.setItem(key, JSON.stringify(data));
        osv(data);
    };

    let castedVal = value as T;
    return [castedVal, setValue];
}

export function useLogonInfo() {
    let [val, setVal] = useLocalStorage("logon-info");

    if(!val || Date.now() - val.lastUpdate > 60000 * 5) {
        fetch("/api/core.usermgmt/logon-info")
            .then(res => res.json())
            .then(res => setVal({lastUpdate: Date.now(), data: res}));
    }

    return val?.data as {
        loggedIn: boolean,
        uid?: string,
        user?: Partial<User>,
        additionalData: {
            permissionGroup: string,
            permissions: Partial<Permission>[]
        }
    };
}

export function invalidateLogonInfo() {
    window.localStorage.removeItem("logon-info");
}

export function usePermissions(...permissions: string[]) {
    let logonInfo = useLogonInfo();
    if(!logonInfo) return permissions.map(() => false);

    return permissions.map(p => logonInfo.additionalData.permissions.some(perm => perm.name === p));
}
