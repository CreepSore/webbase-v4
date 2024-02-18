import React from "react";

import "./style.css";
import IUser from "@extensions/Core.Usermgmt/Interfaces/ModelTypes";
import { useQuery } from "@extensions/Core.GraphQL/web/GraphQLHooks";

import UsermgmtPermissions from "@extensions/Core.Usermgmt.Web/permissions";
import UserEditorDialog from "./components/UserEditorDialog";
import UserAddDialog from "./components/UserAddDialog";
import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";

interface UsersTableRowProps {
    user: IUser;
    onStartEditUser: (user: IUser) => void;
}

function UsersTableRow(props: UsersTableRowProps): JSX.Element {
    return <TableRow>
        <TableCell>{props.user.id}</TableCell>
        <TableCell>{props.user.username}</TableCell>
        <TableCell>{props.user.email}</TableCell>
        <TableCell>{props.user.permissionGroup.name}</TableCell>
        <TableCell>
            <Button variant="outlined" color="info" onClick={() => props.onStartEditUser(props.user)}>Edit</Button>
        </TableCell>
    </TableRow>;
}

interface UsersTableProps {
    users: IUser[];
    addButtonVisible: boolean;
    editButtonVisible: boolean;
    onStartEditUser: (user: IUser) => void;
    onStartAddUser: () => void;
}

function UsersTable(props: UsersTableProps): JSX.Element {
    return <TableContainer className="users-table-container">
        <Table className="users-table" size="small">
            <TableHead>
                <TableRow>
                    <TableCell scope="col">Id</TableCell>
                    <TableCell scope="col">Username</TableCell>
                    <TableCell scope="col">Email</TableCell>
                    <TableCell scope="col">Permission Group</TableCell>
                    <TableCell scope="col">
                        <Button variant="outlined" color="success" onClick={() => props.onStartAddUser()}>Add</Button>
                    </TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {props.users.map(user => <UsersTableRow
                    key={user.id}
                    user={user}
                    onStartEditUser={props.onStartEditUser}
                />)}
            </TableBody>
        </Table>
    </TableContainer>;
}

interface UsersPageProps {
    myUser: IUser;
    afterImpersonate: () => void;
}

export default function UsersPage(props: UsersPageProps): JSX.Element {
    const myPermissions = React.useMemo(() => (props.myUser?.permissionGroup?.permissions || []).map(p => p.name), [props.myUser]);
    const [users, setUsers] = React.useState([]);
    const [editingUser, setEditingUser] = React.useState<IUser>(null);
    const [addUserDialogVisible, setAddUserDialogVisible] = React.useState(false);
    const usersQuery = useQuery<{users: IUser[]}>("{ users { id, username, email, isActive, permissionGroup { id, name } } }", {
        onSuccess: (data, errors) => {
            if(!errors?.length) {
                setUsers(data.users);
            }
        },
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
