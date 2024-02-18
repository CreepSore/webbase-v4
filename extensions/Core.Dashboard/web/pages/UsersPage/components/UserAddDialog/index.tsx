import React from "react";
import { IPermissionGroup } from "@extensions/Core.Usermgmt/Interfaces/ModelTypes";
import { useMutation, useQuery } from "@extensions/Core.GraphQL/web/GraphQLHooks";

import "./style.css";
import { Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, MenuItem, Select, TextField } from "@mui/material";

interface UserEditorDialogProps {
    onClose: () => void;
    afterSave: () => void;
}

export default function UserAddDialog(props: UserEditorDialogProps): JSX.Element {
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

    useQuery<{permissionGroups: IPermissionGroup[]}>("{ permissionGroups { id, name } }", {
        onSuccess: (data) => setPermissionGroups(data.permissionGroups),
    });

    const addUserMutation = useMutation(`mutation CreateUser($username: String!, $email: String, $password: String!, $isActive: Boolean, $permissionGroupId: Int) {
        createUser(username: $username, email: $email, password: $password, isActive: $isActive, permissionGroupId: $permissionGroupId)
    }`, {
        onSuccess: () => props.afterSave(),
        onError: () => props.afterSave(),
    });

    const addUser = (): void => {
        addUserMutation.execute({
            username,
            email,
            isActive,
            password,
            permissionGroupId: permissionGroup ? permissionGroup.id : 1,
        });
    };

    return <Dialog open={true} className="dialog user-add-dialog" PaperProps={{
        className: "w-full max-w-md",
    }}>
        <DialogTitle className="flex">
            <p>Add User</p>
        </DialogTitle>
        <DialogContent className="flex flex-col gap-2 mt-2">
            <TextField
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                label="Username"
                size="small"
            />

            <TextField
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                label="Email"
                size="small"
            />

            <FormControlLabel
                label="IsActive"
                control={
                    <Checkbox
                        checked={isActive}
                        onChange={e => setIsActive(e.target.checked)}
                    />
                }
            />

            <div className="relative">
                <TextField
                    label="Password"
                    className="w-full"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)} />
                <Button
                    color="error"
                    size="small"
                    className="absolute right-1 top-0 bottom-0"
                    onMouseDown={() => setShowPassword(true)}
                    onMouseUp={() => setShowPassword(false)}
                >show</Button>
            </div>

            <Select
                value={String(permissionGroup?.id) ?? "0"}
                onChange={e => setPermissionGroup(permissionGroups.find(pg => String(pg.id) === String(e.target.value)))}
            >
                {permissionGroups.map(pg => <MenuItem key={pg.id} value={pg.id}>{pg.name}</MenuItem>)}
            </Select>
        </DialogContent>
        <DialogActions>
            <div className="flex flex-row gap-1 col-span-1 md:col-span-2 mt-2">
                <Button
                    color="success"
                    onClick={() => {
                        addUser();
                    }}
                >Save</Button>

                <Button
                    onClick={() => {
                        props.onClose();
                    }}
                >Close</Button>
            </div>
        </DialogActions>
    </Dialog>;
}

