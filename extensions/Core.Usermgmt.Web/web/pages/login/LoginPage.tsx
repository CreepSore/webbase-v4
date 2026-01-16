import * as React from "react";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import IUser from "../../../../Core.Usermgmt/types/IUser";
import LoginControl from "../../components/login/LoginControl";

interface LoginPageProperties {
    onLogin?: (me: IUser) => void;
}

export default function LoginPage(props: LoginPageProperties): React.ReactElement {
    return <Paper className="w-[100vw] h-[100vh] flex justify-center items-center" square>
        <Container maxWidth="xs">
            <Paper className="p-3" elevation={3}>
                <LoginControl
                    onLogin={props.onLogin}
                />
            </Paper>
        </Container>
    </Paper>;
}
