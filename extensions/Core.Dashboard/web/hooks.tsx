import React from "react";
import Permission from "../../Core.Usermgmt/Models/Permission";
import User from "../../Core.Usermgmt/Models/User";

export function useFetchJson<T>(url: string, options: RequestInit | undefined = undefined, defaultValue: T = null) : [boolean, T|null, () => void] {
    let [data, setData] = React.useState<T|null>(defaultValue);
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
            }).catch(() => {
                setData(defaultValue);
                setLoading(false);
            })
    }, [loading]);

    return [loading, data, update];
}

export function useLocalStorage<T>(key: string, defaultValue: T = null): [T, (newValue: T) => void] {
    let stored = window.localStorage.getItem(key);
    let [value, setValue] = React.useState<T>(stored ? JSON.parse(stored) : defaultValue);

    let osv = setValue;
    setValue = (data) => {
        window.localStorage.setItem(key, JSON.stringify(data));
        osv(data);
    };

    return [value as T, setValue];
}

export function useLogonInfo() {
    let [val, setVal] = useLocalStorage<{
        data: {
            loggedIn: boolean,
            uid?: string,
            user?: Partial<User>,
            additionalData: {
                permissionGroup: string,
                permissions: Partial<Permission>[]
            }
        },
        lastUpdate: number
    }>("logon-info");

    if(!val || Date.now() - val.lastUpdate > 60000 * 5) {
        fetch("/api/core.usermgmt/logon-info")
            .then(res => res.json())
            .then(res => setVal({lastUpdate: Date.now(), data: res}));
    }

    return val?.data;
}

export function invalidateLogonInfo() {
    window.localStorage.removeItem("logon-info");
}

export function usePermissions(...permissions: string[]) {
    let logonInfo = useLogonInfo();
    if(!logonInfo) return permissions.map(() => false);

    return permissions.map(p => logonInfo.additionalData.permissions.some(perm => perm.name === p));
}

export interface DashboardPage {
    key: string;
    label: string;
    url: string;
    parentMenuTitle?: string; // null = normal menu entry
    showInNavigation: boolean;
}

export function invalidateDashboardPages() {
    window.localStorage.removeItem("dashboard-pages");
}

export function useDashboardPages(): DashboardPage[] {
    let [val, setVal] = useLocalStorage<{data: DashboardPage[], lastUpdate: number}>("dashboard-pages");

    if(!val || Date.now() - val.lastUpdate > 60000 * 5) {
        fetch("/api/core.dashboard/pages")
            .then(res => res.json())
            .then(res => setVal({lastUpdate: Date.now(), data: res}))
            .catch(() => setVal({lastUpdate: Date.now(), data: []}));
    }

    return val?.data || [];
}
