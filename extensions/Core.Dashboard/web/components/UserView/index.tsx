import User from "../../../../Core.Usermgmt/Models/User";
import React from "react";

import "./style.css";
import PermissionGroup from "../../../../Core.Usermgmt/Models/PermissionGroup";
import Permission from "../../../../Core.Usermgmt/Models/Permission";

interface UserButtonProperties {
    user: Partial<User>;
    onClick?: (user: Partial<User>) => void;
}

function UserButton(props: UserButtonProperties) {
    return <button
        className="w-[6em] h-[6em] bg-slate-100 rounded border border-slate-200 hover:brightness-95"
        onClick={() => props.onClick?.(props.user)}
    >
        {props.user.username}
    </button>
}

interface UserEditDialogProperties {
    user: Partial<User>;
    onSave?: (user: Partial<User>) => void;
    onCancel?: () => void;
    onDelete?: (user: Partial<User>) => void;
}

function UserEditDialog(props: UserEditDialogProperties) {
    let [permissionGroups, setPermissionGroups] = React.useState<Partial<PermissionGroup & {permissions: Partial<Permission>}>[]>([]);

    let [username, setUsername] = React.useState(props.user.username || "");
    let [email, setEmail] = React.useState(props.user.email || "");
    let [password, setPassword] = React.useState(props.user.password || "");
    let [isActive, setIsActive] = React.useState(props.user.isActive || false);
    let [permissionGroup, setPermissionGroup] = React.useState(-1);

    React.useEffect(() => {
        fetch("/api/core.usermgmt/permission-group")
            .then(res => res.json())
            .then(data => {
                setPermissionGroups(data);
                setPermissionGroup(props.user.permissionGroupId || -1);
            });
    }, []);

    return <div className="z-50 fixed top-0 left-0 right-0 bottom-0 flex justify-center items-center bg-white">
        <div className="p-2 bg-white w-full max-w-[1000px]">
            <p className="text-xl mb-3">User - {props.user.username}</p>

            <div className="grid grid-cols-4">
                <label>Username</label>
                <div className="w-full col-span-3">
                    <input
                        className="border border-slate-300 focus:border-slate-400 px-1 py-2 w-full"
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                    />
                </div>
                <label>E-Mail</label>
                <div className="w-full col-span-3">
                    <input
                        className="border border-slate-300 focus:border-slate-400 px-1 py-2 w-full"
                        type="text"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />
                </div>
                <label>Password</label>
                <div className="w-full col-span-3">
                    <input
                        className="border border-slate-300 focus:border-slate-400 px-1 py-2 w-full"
                        type="text"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                </div>
                <label>Permission Group</label>
                <div className="w-full col-span-3">
                    <select
                        className="border border-slate-300 focus:border-slate-400 px-1 py-2 w-full"
                        value={permissionGroup}
                        onChange={e => setPermissionGroup(Number(e.target.value))}
                    >
                        {permissionGroups.map(pg => <option key={pg.id} title={pg.description} value={pg.id}>{pg.name}</option>)}
                    </select>
                </div>
                <div className="w-full col-span-4">
                    <span className="flex justify-start">
                        <input
                            className="border border-slate-300 focus:border-slate-400 px-1 py-2"
                            type="checkbox"
                            id="userdialog-isactive"
                            checked={isActive}
                            onChange={e => setIsActive(e.target.checked)}
                        />
                        <label htmlFor="userdialog-isactive" className="pl-3">IsActive</label>
                    </span>
                </div>
            </div>

            <div className="flex flex-col gap-1 mt-2">
                {props.onSave && <button
                    className="border bg-green-200 hover:brightness-105 py-2"
                    onClick={() => props.onSave?.({
                        id: props.user?.id,
                        username,
                        email,
                        password,
                        isActive,
                        permissionGroupId: permissionGroup
                    })}
                >Save</button>}
                {props.onCancel && <button
                    className="border bg-slate-200 hover:brightness-95 py-2"
                    onClick={() => props.onCancel?.()}
                >Cancel</button>}
                {props.onDelete && props.user.id && <button
                    className="border bg-red-200 hover:brightness-95 py-2"
                    onClick={() => props.onDelete?.(props.user)}
                >Delete</button>}
            </div>
        </div>
    </div>;
}

interface UserViewProps {
    setCurrentPage: (key: string) => void;
}

export default function UserView(props: UserViewProps) {
    let [users, setUsers] = React.useState<Partial<User>[]>([]);
    let [userEditDialogVisible, setUserEditDialogVisible] = React.useState(false);
    let [userEditDialogUser, setUserEditDialogUser] = React.useState<Partial<User>>({});
    let [isLoading, setIsLoading] = React.useState(false);

    let [search, setSearch] = React.useState("");
    let searchUsers = React.useMemo(() => {
        let searchString = search.replace("*", ".*");
        let searchRegex = new RegExp(searchString, "gi");
        return users.filter(user => searchRegex.test(String(user.username)));
    }, [search, users]);

    let updateUsers = async() => {
        return await fetch("/api/core.usermgmt/user")
            .then(res => res.json())
            .then(data => {
                if(data.success !== false) {
                    setUsers(data);
                }
                else {
                    props.setCurrentPage("login");
                }
            });
    };

    React.useEffect(() => {
        updateUsers();
    }, []);

    return <>
        {isLoading && <div className="fixed top-0 right-0 bottom-0 left-0 bg-white/50 z-[999]"></div>}

        {userEditDialogVisible && <UserEditDialog
            user={userEditDialogUser}
            onSave={(user) => {
                setUserEditDialogVisible(false);

                if(user.id) {
                    setIsLoading(true);
                    fetch(`/api/core.usermgmt/user/${user.id}`, {
                        method: "PATCH",
                        body: JSON.stringify({
                            username: user.username,
                            email: user.email || null,
                            password: user.password,
                            isActive: user.isActive ? 1 : 0,
                            permissionGroupId: user.permissionGroupId
                        }),
                        headers: {
                            "Content-Type": "application/json"
                        }
                    }).then(() => updateUsers())
                        .then(() => setIsLoading(false));
                }
                else {
                    setIsLoading(true);
                    fetch("/api/core.usermgmt/user", {
                        method: "PUT",
                        body: JSON.stringify({
                            username: user.username,
                            email: user.email || null,
                            password: user.password,
                            isActive: user.isActive ? 1: 0,
                            permissionGroupId: user.permissionGroupId
                        }),
                        headers: {
                            "Content-Type": "application/json"
                        }
                    }).then(() => updateUsers())
                        .then(() => setIsLoading(false));
                }

                setUserEditDialogUser({});
            }}
            onCancel={() => {
                setUserEditDialogVisible(false);
                setUserEditDialogUser({});
            }}
            onDelete={(user) => {
                setUserEditDialogVisible(false);
                setUserEditDialogUser({});

                if(!user.id) return;

                setIsLoading(true);
                fetch(`/api/core.usermgmt/user/${user.id}`, {
                    method: "DELETE"
                }).then(() => updateUsers())
                    .then(() => setIsLoading(false));
            }}
        />}

        <div className="flex justify-center items-center">
            <div className="flex flex-col max-w-screen-md w-full p-3">
                <div className="w-full">
                    <label className="mr-3">Search</label>
                    <input
                        type="text"
                        className="border border-slate-300 py-2 px-1 w-full"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-3 mt-2">
                    {!search && <button
                        className="w-[6em] h-[6em] bg-green-100 rounded border border-green-200 hover:brightness-95"
                        onClick={() => {
                            setUserEditDialogUser({});
                            setUserEditDialogVisible(true);
                        }}
                    >
                        Add new User
                    </button>}

                    {searchUsers.map(user => <UserButton
                        key={user.id}
                        user={user}
                        onClick={user => {
                            setUserEditDialogUser(user);
                            setUserEditDialogVisible(true);
                        }}
                    />)}
                </div>
            </div>
        </div>
    </>;
}
