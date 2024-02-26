import IUser from "@extensions/Core.Usermgmt/types/IUser";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import * as React from "react";

interface EditUserDialogProperties {
    type: "edit"|"create";
    user?: IUser;
    onUserCreated?: (user: IUser) => void;
    onClose?: () => void;
}

export default function EditUserDialog(props: EditUserDialogProperties): JSX.Element {
    const [user, setUser] = React.useState<Partial<IUser>>(props.user || {});

    const mergeUserProperties = (properties: Partial<IUser>): void => {
        setUser({
            ...user,
            ...properties,
        });
    };

    const createUser = (): void => {
        props.onUserCreated?.(user as IUser);
        props.onClose?.();
    };

    return <Dialog open fullWidth>
        <DialogTitle>Create User</DialogTitle>
        <DialogContent>
            <form
                className=""
                onSubmit={() => createUser()}
            >
                <TextField
                    label="Username"
                    value={user.username}
                    onChange={e => mergeUserProperties({username: e.target.value})}
                />

                <TextField
                    label="Email"
                    value={user.email}
                    onChange={e => mergeUserProperties({email: e.target.value})}
                ></TextField>
            </form>
        </DialogContent>
        <DialogActions>
            <Button
                color="success"
                variant="outlined"
                onClick={() => {
                    createUser();
                }}
                size="small"
            >Create</Button>

            <Button
                variant="outlined"
                onClick={() => props.onClose?.()}
                size="small"
            >Cancel</Button>
        </DialogActions>
    </Dialog>;
}
