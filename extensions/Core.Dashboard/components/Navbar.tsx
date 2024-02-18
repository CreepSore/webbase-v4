import * as React from "react";
import { AppBar, Toolbar } from "@mui/material";

export default function Navbar(): JSX.Element {
    return <AppBar position="static">
        <Toolbar>
            <h1 className="font-thin">Dashboard</h1>
        </Toolbar>
    </AppBar>;
}
