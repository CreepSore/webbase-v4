import React from "react";
import User from "../../../../Core.Usermgmt/Models/User";

import {useFetchJson} from "../../hooks";

import "./style.css";

interface UserEditProps {
    user?: Partial<User>;
    resetOnSave?: boolean
    onSaveClicked: (user: User) => void,
}

function UserEdit(props: UserEditProps) {
    let {user, onSaveClicked, resetOnSave} = props;

    let [username, setUsername] = React.useState(user?.username || "");
    let [email, setEmail] = React.useState(user?.email || "");
    let [password, setPassword] = React.useState(user?.password || "");
    let [active, setActive] = React.useState(user?.isActive ?? false);

    let save = () => {
        if(resetOnSave) {
            setUsername(user?.username || "");
            setEmail(user?.email || "");
            setPassword(user?.password || "");
            setActive(user?.isActive ?? false);
        }

        onSaveClicked({
            id: user?.id,
            username,
            email,
            password,
            isActive: active
        });
    }

    return <>
        <th scope="row"></th>
        <th scope="row"><input type="text" value={username} onChange={e => setUsername(e.target.value)}/></th>
        <th scope="row"><input type="text" value={email} onChange={e => setEmail(e.target.value)}/></th>
        <td><input type="text" value={password} onChange={e => setPassword(e.target.value)}/></td>
        <td><input type="checkbox" value={active ? "true" : "false"} onChange={e => setActive(e.target.checked)} /></td>
        <td></td>
        <td></td>
        <td><button onClick={() => save()}>Save</button></td>
    </>;
}

export default function UserEditTable() {
    let [loading, users, update] = useFetchJson<User[]>("/user");
    let [passwordVisible, setPasswordVisible] = React.useState(false);
    let [editMode, setEditMode] = React.useState<string>("");

    React.useEffect(() => {
        if(!users) return;

        let user = users.find(u => u.id === editMode);
        if(!user) return;

    }, [editMode]);

    let save = (user: User) => {
        let {username, email, password, isActive} = user;
        setEditMode("");
        fetch("/core.dashboard/user", { 
            method: "PATCH",
            body: JSON.stringify({
                id: user.id,
                username: username,
                email: email || null,
                password: password,
                isActive: isActive
            }),
            headers: {
                "Content-Type": "application/json"
            }
        }).then(() => update());
    }

    let create = (user: User) => {
        let {username, email, password, isActive} = user;

        fetch("/core.dashboard/user", {
            method: "PUT",
            body: JSON.stringify({
                username,
                email,
                password,
                isActive
            }),
            headers: {
                "Content-Type": "application/json"
            }
        }).then(() => update());
    }

    return <div className="bg-slate-100 rounded-md">
        {!loading && <table className="w-full user-edit-table">
            <thead>
                <tr>
                    <th scope="col">Id</th>
                    <th scope="col">Username</th>
                    <th scope="col">Email</th>
                    <th scope="col">Password</th>
                    <th scope="col">Active</th>
                    <th scope="col">Created</th>
                    <th scope="col">Modified</th>
                    <th></th>
                </tr>
            </thead>
            <tbody className="text-center">
                {users?.filter(u => !editMode || u.id === editMode).map(u => <tr key={u.id}>
                    {!Boolean(editMode) && <>
                        <th scope="row">{u.id}</th>
                        <th scope="row">{u.username}</th>
                        <th scope="row">{u.email}</th>
                        <td>{passwordVisible ? u.password : "************"}</td>
                        <td>{String(Number(u.isActive) === 1)}</td>
                        <td>{u.created ? new Date(Number(u.created)).toISOString() : ""}</td>
                        <td>{u.modified ? new Date(Number(u.modified)).toISOString() : ""}</td>
                        <td><button onClick={() => setEditMode(String(u.id))}>Edit</button></td>
                    </>}

                    {Boolean(editMode) && u.id === editMode && <>
                        <UserEdit
                            user={u}
                            onSaveClicked={(u) => save(u)}
                        />
                    </>}
                </tr>)}

                {!editMode && <tr>
                    <UserEdit
                        onSaveClicked={(u) => create(u)}
                        resetOnSave={true}
                    />
                </tr>}
            </tbody>
        </table>}
    </div>;
}
