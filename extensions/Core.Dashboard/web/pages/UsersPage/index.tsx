import React from "react";

import "./style.css";
import IUser from "@extensions/Core.Usermgmt/Interfaces/ModelTypes";
import { useQuery } from "@extensions/Core.GraphQL/web/GraphQLHooks";

import UsermgmtPermissions from "@extensions/Core.Usermgmt.Web/permissions";
import UserEditorDialog from "./components/UserEditorDialog";
import UserAddDialog from "./components/UserAddDialog";
import INavigator from "../../interfaces/INavigator";

interface UsersTableRowProps {
    user: IUser;
    onStartEditUser: (user: IUser) => void;
}

function UsersTableRow(props: UsersTableRowProps) {
    return <tr>
        <td>{props.user.id}</td>
        <td>{props.user.username}</td>
        <td>{props.user.email}</td>
        <td>{props.user.permissionGroup.name}</td>
        <td><button className="edit-button" onClick={() => props.onStartEditUser(props.user)}>Edit</button></td>
    </tr>;
}

interface UsersTableProps {
    users: IUser[];
    addButtonVisible: boolean;
    editButtonVisible: boolean;
    onStartEditUser: (user: IUser) => void;
    onStartAddUser: () => void;
}

function UsersTable(props: UsersTableProps) {
    return <div className="users-table-container">
        <table className="users-table">
            <thead>
                <tr>
                    <th scope="col">Id</th>
                    <th scope="col">Username</th>
                    <th scope="col">Email</th>
                    <th scope="col">Permission Group</th>
                    <th scope="col"><button className="add-button" onClick={() => props.onStartAddUser()}>Add</button></th>
                </tr>
            </thead>
            <tbody>
                {props.users.map(user => <UsersTableRow
                    key={user.id}
                    user={user}
                    onStartEditUser={props.onStartEditUser}
                />)}
            </tbody>
        </table>
    </div>;
}

interface UsersPageProps {
    myUser: IUser;
    afterImpersonate: () => void;
}

export default function UsersPage(props: UsersPageProps) {
    const myPermissions = React.useMemo(() => (props.myUser?.permissionGroup?.permissions || []).map(p => p.name), [props.myUser]);
    const [users, setUsers] = React.useState([]);
    const [editingUser, setEditingUser] = React.useState<IUser>(null);
    const [addUserDialogVisible, setAddUserDialogVisible] = React.useState(false);
    const usersQuery = useQuery<{users: IUser[]}>(`{ users { id, username, email, isActive, permissionGroup { id, name } } }`, {
        onSuccess: (data, errors) => {
            if(!errors?.length) {
                setUsers(data.users);
            }
        }
    });

    return <div className="users-page">
        {addUserDialogVisible && <UserAddDialog
            onClose={() => setAddUserDialogVisible(false)}
            afterSave={() => {
                setAddUserDialogVisible(false);
                usersQuery.forceUpdate();
            }}
        />}

        {editingUser && <UserEditorDialog
            user={editingUser}
            onClose={() => {
                setEditingUser(null);
            }}
            afterSave={() => {
                setEditingUser(null);
                usersQuery.forceUpdate();
            }}
            afterDelete={() => {
                setEditingUser(null);
                usersQuery.forceUpdate();
            }}
            afterImpersonate={() => {
                props.afterImpersonate();
            }}
        />}

        <UsersTable
            users={users}
            addButtonVisible={myPermissions.includes(UsermgmtPermissions.CreateUser.name)}
            editButtonVisible={myPermissions.includes(UsermgmtPermissions.EditUser.name)}
            onStartEditUser={user => setEditingUser(user)}
            onStartAddUser={() => setAddUserDialogVisible(true)}
        />
    </div>;
}
