import TextField from "@mui/material/TextField";
import * as React from "react";
import { LoginControlProperties } from "./LoginControlProperties";

export default function PasswordLoginControl(props: LoginControlProperties) {
    return <TextField
        variant="standard"
        type="password"
        label="Password"
        value={props.value}
        onChange={e => props.onChange(e.target.value)}
        autoFocus
    />;
}
