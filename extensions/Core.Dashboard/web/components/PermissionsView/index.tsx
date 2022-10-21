import React from "react";
import Permission from "../../../../Core.Usermgmt/Models/Permission";
import PermissionGroup from "../../../../Core.Usermgmt/Models/PermissionGroup";

import UsermgmtPermissions from "../../../../Core.Usermgmt.Web/permissions";
import {usePermissions} from "../../hooks";

export default function PermissionsView() {
    let [permEditPermissions] = usePermissions(UsermgmtPermissions.EditPermissions.name);

    let [permissionGroups, setPermissionGroups] = React.useState<Partial<PermissionGroup & {permissions: Partial<Permission[]>}>[]>([]);
    let [permissions, setPermissions] = React.useState<Partial<Permission>[]>([]);
    let [selectedPermissionGroupId, setSelectedPermissionGroupId] = React.useState(-1);
    let selectedPermissionGroup = React.useMemo<Partial<PermissionGroup & {permissions: Partial<Permission[]>}> | null>(() => {
        let found = permissionGroups.find(pg => pg.id === selectedPermissionGroupId);
        return found || null;
    }, [selectedPermissionGroupId, permissionGroups]);
    let selectedPermissions = React.useMemo<Partial<Permission>[]>(() => {
        if(selectedPermissionGroup === null) return [];
        return selectedPermissionGroup.permissions as Permission[];
    }, [selectedPermissionGroup, permissionGroups]);

    let nonselectedPermissions = React.useMemo<Partial<Permission>[]>(() => {
        if(selectedPermissionGroup === null) return [];
        let idArr = selectedPermissionGroup.permissions?.map(sp => sp?.name) || [];

        return permissions.filter(p => !idArr.includes(p.name));
    }, [selectedPermissionGroup, permissionGroups, permissions]);

    const updatePermissionGroups = () => {
        fetch("/api/core.usermgmt/permission-group")
            .then(res => res.json())
            .then(data => {
                setPermissionGroups(data);
            });
    }

    React.useEffect(() => {
        updatePermissionGroups();

        fetch("/api/core.usermgmt/permission")
            .then(res => res.json())
            .then(data => {
                setPermissions(data);
            });
    }, []);

    const removePermission = (pgid: string, pid: string) => {
        fetch(`/api/core.usermgmt/permission-group/${pgid}/permission/${pid}`, {
            method: "DELETE"
        }).then(res => res.json())
            .then(() => {
                updatePermissionGroups();
            });
    }

    const addPermission = (pgid: string, pid: string) => {
        fetch(`/api/core.usermgmt/permission-group/${pgid}/permission/${pid}`, {
            method: "PUT"
        }).then(res => res.json())
            .then(() => {
                updatePermissionGroups();
            });
    }

    return <div className="grid grid-cols-5">
        <div className="col-span-1 text-center">Group Name</div>
        <div className="col-span-2 text-center">Non-Assigned Permissions</div>
        <div className="col-span-2 text-center">Assigned Permissions</div>

        <div className="border-r border-slate-200 px-1">
            {permissionGroups.map(pg => <div
                key={pg.id}
                className={`grid grid-cols-2 hover:bg-slate-200 cursor-pointer p-1" ${selectedPermissionGroup?.id === pg.id ? "bg-slate-200" : ""}`}
                onClick={() => setSelectedPermissionGroupId(pg?.id || -1)}
            >
                <div>{pg.name}</div>
                <div className="text-right">{pg.description}</div>
            </div>)}
        </div>

        <div className="col-span-2 border-r border-slate-200 px-1">
            {nonselectedPermissions.map(p => <div
            key={p.name}
            className={`grid grid-cols-2 border-b border-b-slate-200 ${permEditPermissions ? "hover:bg-slate-200 cursor-pointer" : ""}`}
            onClick={() => {
                if(!permEditPermissions) return;
                addPermission(String(selectedPermissionGroup?.id), String(p.id));
            }}
        >
                <div>{p.name}</div>
                <div className="text-right">{p.description}</div>
            </div>)}
        </div>

        <div className="col-span-2 px-1">
            {selectedPermissions.map(p => <div
                key={p.name}
                className={`grid grid-cols-2 border-b border-b-slate-200 ${permEditPermissions ? "hover:bg-slate-200 cursor-pointer" : ""}`}
                onClick={() => {
                    if(!permEditPermissions) return;
                    removePermission(String(selectedPermissionGroup?.id), p.id);
                }}
            >
                <div>{p.name}</div>
                <div className="text-right">{p.description}</div>
            </div>)}
        </div>
    </div>;
};
