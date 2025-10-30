import TextField from "@mui/material/TextField/TextField";
import * as React from "react";
import { LoginControlProperties } from "./LoginControlProperties";

export default function KeyLoginControl(props: LoginControlProperties) {
    return <TextField
        variant="standard"
        label="Key"
        value={props.value}
        onChange={e => props.onChange(e.target.value)}
        autoFocus
    />;
}
