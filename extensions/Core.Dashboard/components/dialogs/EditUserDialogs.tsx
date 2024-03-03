import * as React from "react";
import * as uuid from "uuid";
import IUser from "@extensions/Core.Usermgmt/types/IUser";

import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";

import useFetchApi from "@extensions/Core.React/hooks/useFetchApi";
import UsermgmtWebApi from "@extensions/Core.Usermgmt.Web/web/UsermgmtWebApi";
import AuthenticationType from "@extensions/Core.Usermgmt/types/AuthenticationTypes";
import EditAuthTypeDialog from "./EditAuthTypeDialog";

interface EditUserDialogProperties {
    type: "edit"|"create";
    user?: IUser;
    onUserEdited?: (user: IUser) => void;
    onUserCreated?: (user: IUser) => void;
    onClose?: () => void;
}

export default function EditUserDialog(props: EditUserDialogProperties): JSX.Element {
    const [availableGroups] = useFetchApi(
        () => UsermgmtWebApi.getPermissionGroups(),
        [{name: "...", description: "...", permissions: []}],
        (groups) => {
            if(!user.groups) {
                const anonGroup = groups.find(g => g.name === "Anonymous");
                if(anonGroup) {
                    mergeUserProperties({groups: [anonGroup]});
                }
            }
        },
    );

    const [availableAuthTypes] = useFetchApi(
        () => UsermgmtWebApi.getAuthenticationTypes(),
        [],
        (types) => {
            setSelectedAuthType(types[0]);
        },
    );

    const [user, setUser] = React.useState<Partial<IUser>>(props.user || {
        username: "",
        apiKeys: [],
        authentication: [],
        groups: [],
    });

    const [authTypeDialogMode, setAuthTypeDialogMode] = React.useState(null);
    const [authTypeDialogType, setAuthTypeDialogType] = React.useState<Partial<AuthenticationType>>(null);
    const [selectedAuthType, setSelectedAuthType] = React.useState("");

    const [errorUsername, setErrorUsername] = React.useState(false);
    const [errorGroups, setErrorGroups] = React.useState(false);
    const hasError = React.useMemo(
        () => errorUsername
            || errorGroups,
        [errorUsername, errorGroups],
    );

    // Functions

    const mergeUserProperties = (properties: Partial<IUser>): void => {
        setUser({
            ...user,
            ...properties,
        });
    };

    const validate = (): void => {
        setErrorUsername(Boolean(user.username));
        setErrorGroups((user.groups.length || []) === 0);
    };

    const editUser = (): void => {
        if(props.type === "create") {
            UsermgmtWebApi.createUser(user as IUser)
                .then(() => props?.onUserCreated?.(user as IUser));
        }
        else if(props.type === "edit") {
            UsermgmtWebApi.editUser(user as IUser)
                .then(() => props?.onUserEdited?.(user as IUser));
        }

        props.onClose?.();
    };

    return <Dialog open fullWidth>
        <DialogTitle>{props.type === "create" ? "Create" : "Edit"} User</DialogTitle>
        <DialogContent>
            {authTypeDialogType && <EditAuthTypeDialog
                type={authTypeDialogMode}
                authenticationType={authTypeDialogType}
                onCreated={finishedAuthType => mergeUserProperties({
                    authentication: [...(user.authentication || []), finishedAuthType],
                })}
                onEdited={finishedAuthType => {
                    mergeUserProperties({
                        authentication: [...(user.authentication || []).filter(x => x !== authTypeDialogType), finishedAuthType],
                    });
                }}
                onClose={() => setAuthTypeDialogType(null)}
            />}

            <form
                className="grid grid-cols-1 gap-2 mt-2"
                onSubmit={() => editUser()}
            >
                <TextField
                    label="Username"
                    value={user.username}
                    onChange={e => mergeUserProperties({username: e.target.value})}
                    error={errorUsername}
                    required
                />

                <TextField
                    label="Email"
                    value={user.email}
                    onChange={e => mergeUserProperties({email: e.target.value})}
                />

                <FormControl>
                    <InputLabel
                        id="group-input-label"
                    >Groups</InputLabel>

                    <Select
                        label="Groups"
                        labelId="group-input-label"
                        value={(user.groups || []).map(g => g.name)}
                        multiple
                        onChange={e => {
                            mergeUserProperties({
                                groups: (e.target.value as string[]).map(groupKey => availableGroups.find(group => group.name === groupKey)),
                            });
                        }}
                        renderValue={(selected) => {
                            return selected.map(value => <Chip className="mr-2" key={value} label={value} />);
                        }}
                        error={errorGroups}
                        required
                    >
                        {availableGroups.map(g => <MenuItem key={g.name} value={g.name} title={g.description}>{g.name}</MenuItem>)}
                    </Select>
                </FormControl>

                <Divider />

                <div className="grid grid-cols-1 gap-2 mt-2">
                    <div className="flex justify-end">
                        <FormControl fullWidth>
                            <InputLabel
                                id="auth-types-input-label"
                            >Auth-Types</InputLabel>

                            <Select
                                label="Auth-Types"
                                labelId="auth-types-input-label"
                                value={selectedAuthType}
                                onChange={e => setSelectedAuthType(e.target.value)}
                            >
                                {availableAuthTypes.map(at => <MenuItem key={at} value={at}>{at}</MenuItem>)}
                            </Select>
                        </FormControl>

                        <Button
                            color="success"
                            onClick={() => {
                                setAuthTypeDialogMode("create");
                                setAuthTypeDialogType({
                                    // @ts-ignore
                                    type: selectedAuthType,
                                });
                            }}
                            fullWidth
                        >Add Auth Type</Button>
                    </div>

                    <div className="grid grid-cols-2 overflow-y-auto max-h-32">
                        {(user.authentication || []).map((auth, i) => <React.Fragment key={i}>
                            <div>{auth.type}</div>
                            <div className="flex justify-end">
                                <Button
                                    color="warning"
                                    variant="outlined"
                                    onClick={() => {
                                        setAuthTypeDialogMode("edit");
                                        setAuthTypeDialogType(auth);
                                    }}
                                >Edit</Button>

                                <Button
                                    color="error"
                                    onClick={() => {
                                        mergeUserProperties({
                                            authentication: [...(user.authentication || []).filter(x => x !== auth)],
                                        });
                                    }}
                                >Delete</Button>
                            </div>
                        </React.Fragment>)}
                    </div>
                </div>

                <Divider />

                <div className="grid grid-cols-1 gap-2 mt-2">
                    <div className="flex justify-end">
                        <Button
                            color="success"
                            onClick={() => mergeUserProperties({
                                apiKeys: [...(user.apiKeys || []), uuid.v4()],
                            })}
                        >Create API-Key</Button>
                    </div>

                    <div className="overflow-y-auto max-h-32">
                        {(user.apiKeys || []).map(key => <div className="flex justify-between" key={key}>
                            <p>{key}</p>
                            <Button
                                color="error"
                                size="small"
                                onClick={() => mergeUserProperties({
                                    apiKeys: (user.apiKeys || []).filter(k => k !== key),
                                })}
                            >Delete</Button>
                        </div>)}
                    </div>
                </div>
            </form>
        </DialogContent>
        <DialogActions>
            <Button
                color="success"
                variant="outlined"
                onClick={() => {
                    editUser();
                }}
                size="small"
            >{{edit: "Edit", create: "Create"}[props.type]}</Button>

            <Button
                variant="outlined"
                onClick={() => props.onClose?.()}
                size="small"
            >Cancel</Button>
        </DialogActions>
    </Dialog>;
}
