import * as React from "react";
import TextField from "@mui/material/TextField";
import { LoginControlProperties } from "./LoginControlProperties";

export default function TotpLoginControl(props: LoginControlProperties) {
    return <TextField
        variant="standard"
        type="text"
        label="2FA"
        value={props.value}
        onChange={e => props.onChange(e.target.value)}
        autoComplete="one-time-code"
        autoFocus
    />;
}
