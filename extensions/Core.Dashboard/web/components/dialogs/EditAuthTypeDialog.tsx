import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import AuthenticationType from "@extensions/Core.Usermgmt/types/AuthenticationTypes";

interface EditAuthTypeDialogProperties<AuthType> {
    type: "edit" | "create";
    authenticationType: Partial<AuthType>;
    onEdited?: (editedType: AuthType) => void;
    onCreated?: (finishedType: AuthType) => void;
    onClose?: () => void;
}

export default function EditAuthTypeDialog<AuthType extends AuthenticationType>(props: EditAuthTypeDialogProperties<AuthType>): JSX.Element {
    const passwordEntryNeeded = (["password", "password_totp"] as AuthenticationType["type"][]).includes(props.authenticationType.type);
    const totpEntryneeded = (["totp", "password_totp"] as AuthenticationType["type"][]).includes(props.authenticationType.type);
    const keyEntryNeeded = (["permanent_key", "once_key"] as AuthenticationType["type"][]).includes(props.authenticationType.type);

    // @ts-ignore
    const [password, setPassword] = React.useState(props.authenticationType.password || "");
    // @ts-ignore
    const [totpKey, setTotpKey] = React.useState(props.authenticationType.secret || "");
    // @ts-ignore
    const [keys, setKeys] = React.useState<string[]>(props.authenticationType.keys || []);
    const [key, setKey] = React.useState("");

    const generateAuthType = (): AuthType & {wasEdited: boolean} => {
        switch(props.authenticationType.type) {
            case "password": return {
                type: "password",
                password,
                wasEdited: true,
            } as unknown as AuthType & {wasEdited: boolean};

            case "password_totp": return {
                type: "password_totp",
                password,
                secret: totpKey,
                wasEdited: true,
            } as unknown as AuthType & {wasEdited: boolean};

            case "totp": return {
                type: "totp",
                secret: totpKey,
                wasEdited: true,
            } as unknown as AuthType & {wasEdited: boolean};

            case "permanent_key": return {
                type: "permanent_key",
                keys,
                wasEdited: true,
            } as unknown as AuthType & {wasEdited: boolean};

            case "once_key": return {
                type: "permanent_key",
                keys,
                wasEdited: true,
            } as unknown as AuthType & {wasEdited: boolean};

            default: return null;
        }
    };

    return <Dialog open fullWidth>
        <DialogTitle><p className="font-thin">Edit Auth Type - "{props.authenticationType.type}"</p></DialogTitle>

        <DialogContent>
            <form
                className="grid grid-cols-1 gap-2 mt-2"
                onSubmit={e => {
                    e.preventDefault();
                }}
            >
                {/* PASSWORD */}
                {passwordEntryNeeded && <TextField
                    label="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                />}

                {/* TOTP */}
                {totpEntryneeded && <TextField
                    label="TOTP Secret"
                    value={totpKey}
                    onChange={e => setTotpKey(e.target.value)}
                    required
                />}

                {/* KEY */}
                {keyEntryNeeded && <div className="grid-cols-4">
                    <TextField
                        size="small"
                        inputProps={{className: "col-span-3"}}
                        label="Key"
                        value={key}
                        onChange={e => setKey(e.target.value)}
                    />

                    <Button
                        className="col-span-1"
                        color="success"
                        variant="outlined"
                        onClick={() => {
                            if(!Boolean(key)) return;

                            setKey("");

                            if(!keys.includes(key)) {
                                setKeys([...keys, key]);
                            }
                        }}
                    >Add</Button>

                    <div className="grid grid-cols-4">
                        {keys.map(k => <React.Fragment key={k}>
                            <div className="col-span-3">{k}</div>
                            <div className="col-span-1">
                                <Button
                                    color="error"
                                    onClick={() => {
                                        setKeys(keys.filter(ck => ck !== k));
                                    }}
                                    fullWidth
                                >Delete</Button>
                            </div>
                            <Divider className="col-span-4" />
                        </React.Fragment>)}
                    </div>
                </div>}

                <Divider />

                <div className="flex justify-end">
                    <Button
                        className="mt-2"
                        color="success"
                        variant="outlined"
                        onClick={() => {
                            if(props.type === "create") {
                                props.onCreated?.(generateAuthType());
                            }
                            else if(props.type === "edit") {
                                props.onEdited?.(generateAuthType());
                            }
                            props.onClose?.();
                        }}
                    >Save</Button>

                    <Button
                        onClick={() => {
                            props.onClose?.();
                        }}
                    >Cancel</Button>
                </div>
            </form>
        </DialogContent>
    </Dialog>;
}
