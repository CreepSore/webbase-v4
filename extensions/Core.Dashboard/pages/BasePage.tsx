import { Breakpoint, Container, Paper } from "@mui/material";
import * as React from "react";
import Navbar from "../components/Navbar";

interface BasePageProperties {
    maxWidth?: false | Breakpoint;
}

export default function BasePage(props: React.PropsWithChildren<BasePageProperties>): JSX.Element {
    return <Paper className="min-w-[100vw] min-h-[100vh]" square>
        <Navbar />
        <Container maxWidth={props.maxWidth}>
            {props.children}
        </Container>
    </Paper>;
}
