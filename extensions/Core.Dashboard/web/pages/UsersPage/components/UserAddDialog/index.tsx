import React from "react";
import IUser, { IPermissionGroup } from "@extensions/Core.Usermgmt/Interfaces/ModelTypes";
import { useMutation, useQuery } from "@extensions/Core.GraphQL/web/GraphQLHooks";

import "./style.css";

interface UserEditorDialogProps {
    onClose: () => void;
    afterSave: () => void;
}

export default function UserAddDialog(props: UserEditorDialogProps) {
    const [username, setUsername] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [isActive, setIsActive] = React.useState(false);
    const [password, setPassword] = React.useState("");
    const [showPassword, setShowPassword] = React.useState(false);
    const [permissionGroups, setPermissionGroups] = React.useState<IPermissionGroup[]>([]);
    const [permissionGroup, setPermissionGroup] = React.useState<IPermissionGroup>(null);

    React.useEffect(() => {
        setPermissionGroup(permissionGroups.find(pg => pg.id === 1));
    }, [permissionGroups]);

    const pgQuery = useQuery<{permissionGroups: IPermissionGroup[]}>(`{ permissionGroups { id, name } }`, {
        onSuccess: (data) => setPermissionGroups(data.permissionGroups)
    });

    const addUserMutation = useMutation(`mutation CreateUser($username: String!, $email: String, $password: String!, $isActive: Boolean, $permissionGroupId: Int) {
        createUser(username: $username, email: $email, password: $password, isActive: $isActive, permissionGroupId: $permissionGroupId)
    }`, {
        onSuccess: () => props.afterSave(),
        onError: () => props.afterSave()
    })

    const addUser = () => {
        addUserMutation.execute({
            username,
            email,
            isActive,
            password,
            permissionGroupId: permissionGroup ? permissionGroup.id : 1
        });
    };

    return <div className="dialog-container">
        <div className="dialog user-add-dialog">
            <div className="dialog-header">
                <p>Add User</p>
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
                </div>

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

                <label>Permission Group</label>
                <select value={String(permissionGroup?.id) ?? "0"} onChange={e => setPermissionGroup(permissionGroups.find(pg => String(pg.id) === e.target.value))}>
                    {permissionGroups.map(pg => <option key={pg.id} value={pg.id}>{pg.name}</option>)}
                </select>

                <div className="flex flex-col gap-1 col-span-1 md:col-span-2 mt-2">
                    <button
                        className="save-button"
                        onClick={() => {
                            addUser();
                        }}
                    >Save</button>
                </div>
            </div>
        </div>
    </div>;
}

