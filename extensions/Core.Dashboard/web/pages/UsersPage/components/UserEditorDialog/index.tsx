import React from "react";
import IUser, { IPermissionGroup } from "@extensions/Core.Usermgmt/Interfaces/ModelTypes";
import { useMutation, useQuery } from "@extensions/Core.GraphQL/web/GraphQLHooks";

import "./style.css";

interface UserEditorDialogProps {
    user: IUser,
    onClose: () => void;
    afterSave: () => void;
    afterDelete: () => void;
    afterImpersonate: () => void;
}

export default function UserEditorDialog(props: UserEditorDialogProps): JSX.Element {
    const [username, setUsername] = React.useState(props.user.username);
    const [email, setEmail] = React.useState(props.user.email || "");
    const [isActive, setIsActive] = React.useState(props.user.isActive);
    const [password, setPassword] = React.useState("");
    const [updatePassword, setUpdatePassword] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);
    const [deleteCount, setDeleteCount] = React.useState(4);
    const [permissionGroups, setPermissionGroups] = React.useState<IPermissionGroup[]>([]);
    const [permissionGroup, setPermissionGroup] = React.useState<IPermissionGroup>(null);

    React.useEffect(() => {
        setPermissionGroup(permissionGroups.find(pg => pg.id === props.user.permissionGroup.id));
    }, [permissionGroups, props.user.permissionGroup.id]);

    useQuery<{permissionGroups: IPermissionGroup[]}>("{ permissionGroups { id, name } }", {
        onSuccess: (data) => setPermissionGroups(data.permissionGroups),
    });

    const saveUserMutation = useMutation(`mutation UpdUser($id: ID!, $username: String, $email: String, $password: String, $isActive: Boolean, $permissionGroupId: Int) {
        updateUser(id: $id, username: $username, email: $email, password: $password, isActive: $isActive, permissionGroupId: $permissionGroupId)
    }`, {
        onSuccess: () => props.afterSave(),
        onError: () => props.afterSave(),
    });

    const deleteUserMutation = useMutation(`mutation DelUser($id: ID!){
        deleteUser(id: $id)
    }`, {
        onSuccess: () => props.afterDelete(),
        onError: () => props.afterDelete(),
    });

    const impersonateUserMutation = useMutation(`mutation ImpersonateUser($id: ID!){
        impersonateUser(id: $id)
    }`, {
        onSuccess: () => props.afterImpersonate(),
        onError: () => props.afterImpersonate(),
    });

    const saveUser = (): void => {
        saveUserMutation.execute({
            id: props.user.id,
            username,
            email,
            isActive,
            password: (updatePassword && password) ? password : null,
            permissionGroupId: permissionGroup ? permissionGroup.id : props.user.permissionGroup.id,
        });
    };

    const deleteUser = (): void => {
        deleteUserMutation.execute({id: props.user.id});
    };

    const impersonateUser = (): void => {
        impersonateUserMutation.execute({id: props.user.id});
    };

    return <div className="dialog-container">
        <div className="dialog user-edit-dialog">
            <div className="dialog-header">
                <p>Edit User</p>
                <div className="dialog-buttons">
                    <button className="dialog-button-close" onClick={() => props.onClose()}>X</button>
                </div>
            </div>
            <div className="dialog-body">
                <label>Username</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)}/>

                <label>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}/>

                <div className="grid grid-cols-2 col-span-1 md:col-span-2 text-left">
                    <label>IsActive</label>
                    <div className="text-xl"><input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} /></div>

                    <label>Update Password</label>
                    <div className="text-xl"><input type="checkbox" checked={updatePassword} onChange={e => setUpdatePassword(e.target.checked)} /></div>
                </div>

                {updatePassword && <>
                    <label>Password</label>
                    <div className="relative">
                        <input
                            className="w-full"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={e => setPassword(e.target.value)} />
                        <button
                            className="absolute right-1 top-0 bottom-0 text-sm text-black font-thin hover:text-red-600"
                            onMouseDown={() => setShowPassword(true)}
                            onMouseUp={() => setShowPassword(false)}
                        >show</button>
                    </div>
                </>}

                <label>Permission Group</label>
                <select value={String(permissionGroup?.id) ?? "0"} onChange={e => setPermissionGroup(permissionGroups.find(pg => String(pg.id) === e.target.value))}>
                    {permissionGroups.map(pg => <option key={pg.id} value={pg.id}>{pg.name}</option>)}
                </select>

                <div className="flex flex-col gap-1 col-span-1 md:col-span-2 mt-2">
                    <button
                        className="save-button"
                        onClick={() => saveUser()}
                    >Save</button>
                    <button
                        className="impersonate-button"
                        onClick={() => impersonateUser()}
                    >Impersonate</button>
                    <button
                        className="delete-button"
                        onClick={() => {
                            const newCount = deleteCount - 1;
                            if(newCount === 0) {
                                deleteUser();
                                setDeleteCount(4);
                            }
                            else {
                                setDeleteCount(newCount);
                            }
                        }}
                    >{deleteCount === 4 ? "Delete" : `Please confirm (${deleteCount})`}</button>
                </div>
            </div>
        </div>
    </div>;
}

