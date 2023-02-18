import { IPermission, IPermissionGroup } from "@extensions/Core.Usermgmt/Interfaces/ModelTypes";
import React from "react";

interface PermissionsListProps {
    permissions: IPermission[];
    onPermissionClicked: (permission: IPermission) => void;
    className?: string;
}

function PermissionsList(props: PermissionsListProps) {
    return <div className={`flex flex-col w-full select-none ${props.className ? props.className : ""}`}>
        {props.permissions.map(p => <div
            key={p.id}
            className="w-full grid grid-cols-2 text-lg py-0.5 hover:brightness-75 cursor-pointer"
            onClick={() => props.onPermissionClicked(p)}
        >
            <div>{p.name}</div>
            <div>{p.description}</div>
        </div>)}
    </div>;
}

interface PermissionsEditorProps {
    permissionGroups: IPermissionGroup[];
    permissions: IPermission[];
    onPermissionRemoved: (permission: IPermission, group: IPermissionGroup) => void;
    onPermissionAdded: (permission: IPermission, group: IPermissionGroup) => void;
    onCreateButtonClicked: () => void;
}


export default function PermissionsEditor(props: PermissionsEditorProps) {
    const [selectedGroup, setSelectedGroup] = React.useState<number>(1);
    const resolvedGroup = React.useMemo(() => props.permissionGroups.find(pg => pg.id === selectedGroup), [selectedGroup, props.permissionGroups]);
    const assignedPermissions = React.useMemo(() => resolvedGroup ? [...resolvedGroup.permissions] : [], [resolvedGroup]);
    const unassignedPermissions = React.useMemo(() => props.permissions.filter(p => !assignedPermissions.map(p => p.id).includes(p.id)), [assignedPermissions, props.permissions]);

    return <div className="permissions-editor">
        <div className="group-selector">
            <select
                className="bg-violet-600 text-xl w-full text-white"
                value={selectedGroup}
                onChange={e => setSelectedGroup(Number(e.target.value))}
            >
                {props.permissionGroups.map(pg => <option key={pg.id} value={pg.id}>{pg.name} - {pg.description}</option>)}
            </select>
            <button
                className="px-4 py-1 bg-green-600 hover:brightness-105"
                onClick={() => props.onCreateButtonClicked()}
            >Create</button>
        </div>

        <div className="editor">
            <div className="text-xl text-red-600 font-bold py-1">Unassigned Permissions</div>
            <div className="text-xl text-green-600 font-bold py-1">Assigned Permissions</div>

            <PermissionsList
                permissions={unassignedPermissions}
                className="text-red-600 font-mono"
                onPermissionClicked={perm => {
                    props.onPermissionAdded(perm, resolvedGroup);
                }}
            />
            <PermissionsList
                permissions={assignedPermissions}
                className="text-green-600 font-mono"
                onPermissionClicked={perm => {
                    props.onPermissionRemoved(perm, resolvedGroup);
                }}
            />
        </div>
    </div>;
}
