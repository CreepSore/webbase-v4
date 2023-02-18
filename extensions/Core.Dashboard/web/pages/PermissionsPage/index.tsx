import { IPermission, IPermissionGroup } from "@extensions/Core.Usermgmt/Interfaces/ModelTypes";
import e from "express";
import React from "react";

import {useMutation, useQuery} from "../../../../Core.GraphQL/web/GraphQLHooks";
import PermGroupCreateDialog from "./PermGroupCreateDialog";
import PermissionsEditor from "./PermissionsEditor";

import "./style.css";


interface PermissionsPageProps {
    
}

export default function PermissionsPage(props: PermissionsPageProps) {
    const [createGroupDialogOpen, setCreateGroupDialogOpen] = React.useState(false);
    const [permissionGroups, setPermissionGroups] = React.useState<IPermissionGroup[]>([]);
    const [permissions, setPermissions] = React.useState<IPermission[]>([]);
    const permQuery = useQuery<{permissionGroups: IPermissionGroup[], permissions: IPermission[]}>(`{
        permissions {
            id,
            name,
            description
        }
        permissionGroups {
            id,
            name,
            description,
            permissions {
                id,
                name,
                description
            }
        }
    }`, {onSuccess: data => {
        setPermissionGroups(data.permissionGroups.sort((a, b) => String(a.id).localeCompare(String(b.id))));
        setPermissions(data.permissions.sort((a, b) => a.name.localeCompare(b.name)));
    }});

    const mutationAddPerm = useMutation(`mutation addPerm($gid: Int!, $pid: Int!) {
        addPermissionToGroup(permissionGroupId: $gid, permissionId: $pid)
    }`, {
        onSuccess: () => {
            permQuery.forceUpdate();
        }
    });

    const mutationRemovePerm = useMutation(`mutation addPerm($gid: Int!, $pid: Int!) {
        removePermissionFromGroup(permissionGroupId: $gid, permissionId: $pid)
    }`, {
        onSuccess: () => {
            permQuery.forceUpdate();
        }
    });

    return <div className="permissions-page">
        {createGroupDialogOpen && <PermGroupCreateDialog
            onClose={() => {
                setCreateGroupDialogOpen(false);
                permQuery.forceUpdate();
            }}
            afterSave={() => {
                setCreateGroupDialogOpen(false);
                permQuery.forceUpdate();
            }}
        />}

        <PermissionsEditor
            permissionGroups={permissionGroups}
            permissions={permissions}
            onPermissionAdded={(perm, group) => {
                mutationAddPerm.execute({
                    gid: group.id,
                    pid: perm.id
                });
            }}
            onPermissionRemoved={(perm, group) => {
                mutationRemovePerm.execute({
                    gid: group.id,
                    pid: perm.id
                });
            }}
            onCreateButtonClicked={() => {
                setCreateGroupDialogOpen(true);
            }}
        />
    </div>;
}
