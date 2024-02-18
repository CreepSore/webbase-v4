import React from "react";
import IUser, { IPermissionGroup } from "@extensions/Core.Usermgmt/Interfaces/ModelTypes";
import { useMutation, useQuery } from "@extensions/Core.GraphQL/web/GraphQLHooks";

import "./style.css";
import { Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, MenuItem, Select, Table, TableBody, TableCell, TableRow, TextField } from "@mui/material";

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
    const [apiKeys, setApiKeys] = React.useState<{id: string, validUntil: string, userId: string}[]>([]);

    const {forceUpdate: forceUpdateApiKeys} = useQuery<{
        userById: {
            apiKeys: {id: string, validUntil: string, userId: string}[]
        }
    }>(`query getApiKeys($id: ID!) {
        userById(id: $id) {
            apiKeys {
                id,
                validUntil,
                userId
            }
        }
    }`, {
        variables: {id: props.user.id},
        onSuccess: (data, errors) => (errors?.length || 0) === 0 && setApiKeys(data.userById.apiKeys),
    });

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

    const addApiKeyMutation = useMutation(`mutation AddApiKey($id: ID!){
        addApiKeyToUser(userId: $id)
    }`, {
        onSuccess: () => forceUpdateApiKeys(),
        onError: () => forceUpdateApiKeys(),
    });

    const delApiKeyMutation = useMutation(`mutation DelApiKey($id: ID!){
        deleteApiKey(apiKeyId: $id)
    }`, {
        onSuccess: () => forceUpdateApiKeys(),
        onError: () => forceUpdateApiKeys(),
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

    return <Dialog open={true} className="dialog user-edit-dialog" PaperProps={{
        className: "w-full max-w-md",
    }}>
        <DialogTitle className="flex">
            <p>Edit User</p>
            <div className="flex-grow"></div>
            <div>
                <Button
                    color="error"
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
                >{deleteCount === 4 ? "Delete" : `Please confirm (${deleteCount})`}</Button>
            </div>
        </DialogTitle>
        <DialogContent className="flex flex-col gap-2">
            <TextField size="small" label="Username" type="text" value={username} onChange={e => setUsername(e.target.value)}/>

            <TextField size="small" label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)}/>

            <div className="grid grid-cols-2 col-span-1 md:col-span-2 text-left">
                <FormControlLabel
                    label="IsActive"
                    control={
                        <Checkbox
                            checked={isActive}
                            onChange={e => setIsActive(e.target.checked)}
                        />
                    }
                />

                <FormControlLabel
                    label="Update Password"
                    control={
                        <Checkbox
                            checked={updatePassword}
                            onChange={e => setUpdatePassword(e.target.checked)}
                        />
                    }
                />
            </div>

            {updatePassword && <>
                <label>Password</label>
                <div className="relative">
                    <TextField
                        size="small"
                        label="Password"
                        className="w-full"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={e => setPassword(e.target.value)} />
                    <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        className="absolute right-1 top-0 bottom-0"
                        onMouseDown={() => setShowPassword(true)}
                        onMouseUp={() => setShowPassword(false)}
                    >show</Button>
                </div>
            </>}

            <Select
                label="Permission Group"
                value={String(permissionGroup?.id) ?? "0"}
                onChange={e => setPermissionGroup(permissionGroups.find(pg => String(pg.id) === String(e.target.value)))}
            >
                {permissionGroups.map(pg => <MenuItem key={pg.id} value={pg.id}>{pg.name}</MenuItem>)}
            </Select>

            <div className="w-full overflow-y-auto md:max-h-[200px]">
                <div className="col-span-3">
                    <Button
                        color="success"
                        variant="outlined"
                        className="add-api-key-button"
                        onClick={() => {
                            addApiKeyMutation.execute({id: props.user.id});
                        }}
                    >Create ApiKey</Button>
                </div>
                <Table>
                    <TableBody>
                        {apiKeys.map(apiKey => <TableRow key={apiKey.id}>
                            <TableCell>{apiKey.id}</TableCell>
                            <TableCell>{new Date(apiKey.validUntil).toISOString()}</TableCell>
                            <TableCell>
                                <Button
                                    color="error"
                                    variant="outlined"
                                    className="del-api-key-button"
                                    onClick={() => {
                                        delApiKeyMutation.execute({id: apiKey.id});
                                    }}
                                >Delete</Button>
                            </TableCell>
                        </TableRow>)}
                    </TableBody>
                </Table>
            </div>
        </DialogContent>
        <DialogActions>
            <div className="flex flex-row gap-1 col-span-1 md:col-span-2 mt-2">
                <Button
                    color="success"
                    variant="outlined"
                    onClick={() => {
                        saveUser();
                    }}
                >Save</Button>

                <Button
                    className="impersonate-button"
                    onClick={() => impersonateUser()}
                >Impersonate</Button>

                <Button
                    onClick={() => {
                        props.onClose();
                    }}
                >Close</Button>
            </div>
        </DialogActions>
    </Dialog>;
}

