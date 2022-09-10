import React from "react";
import User from "../../../Core.Usermgmt/Models/User";

import {useFetchJson} from "../hooks";

import "./style.css";

export default function UserEditTable() {
    let [loading, users, update] = useFetchJson<User[]>("/user");
    let [passwordVisible, setPasswordVisible] = React.useState(false);
    let [editMode, setEditMode] = React.useState<string>("");

    let [username, setUsername] = React.useState<User["username"]>("");
    let [email, setEmail] = React.useState<User["email"]>("");
    let [password, setPassword] = React.useState<User["password"]>("");
    let [active, setActive] = React.useState<User["isActive"]>(false);

    React.useEffect(() => {
        if(!users) return;

        let user = users.find(u => u.id === editMode);
        if(!user) return;
        setUsername(user.username);
        setEmail(user.email || "");
        setPassword(user.password);
        setActive(Number(user.isActive) === 1);
    }, [editMode]);

    let save = (user: User) => {
        setEditMode("");
        fetch("/user", { 
            method: "PATCH",
            body: JSON.stringify({
                id: user.id,
                username,
                email,
                password,
                isActive: active
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

                    {Boolean(editMode) && <>
                        <th scope="row">{u.id}</th>
                        <th scope="row"><input type="text" value={username} onChange={e => setUsername(e.target.value)}/></th>
                        <th scope="row"><input type="text" value={email} onChange={e => setEmail(e.target.value)}/></th>
                        <td><input type="text" value={password} onChange={e => setPassword(e.target.value)}/></td>
                        <td><input type="checkbox" value={active ? "true" : "false"} onChange={e => setActive(e.target.checked)} /></td>
                        <td>{u.created ? new Date(Number(u.created)).toISOString() : ""}</td>
                        <td>{u.modified ? new Date(Number(u.modified)).toISOString() : ""}</td>
                        <td><button onClick={() => save(u)}>Save</button></td>
                    </>}
                </tr>)}
            </tbody>
        </table>}
    </div>;
}
