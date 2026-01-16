import * as React from "react";

import AppBar from "@mui/material/AppBar";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Toolbar from "@mui/material/Toolbar";
import useMediaQuery from "@mui/material/useMediaQuery";

import MenuIcon from "@mui/icons-material/Menu";

import MeContext from "@extensions/Core.Usermgmt.Web/web/components/me-provider/MeContext";
import UsermgmtWebApi from "@extensions/Core.Usermgmt.Web/web/UsermgmtWebApi";
import Navdrawer from "./Navdrawer";
import NavigatorContext from "@extensions/Core.React/Navigator/NavigatorContext";

export default function Navbar(): React.ReactElement {
    const isMd = useMediaQuery("md");
    const [drawerOpen, setDrawerOpen] = React.useState(isMd);
    const me = React.useContext(MeContext);
    const navigator = React.useContext(NavigatorContext);

    return <AppBar position="static" className="select-none">
        <Navdrawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
        />
        <Toolbar>
            <div>
                <IconButton onClick={() => setDrawerOpen(!drawerOpen)}>
                    <MenuIcon/>
                </IconButton>
            </div>
            <h1 className="font-thin text-2xl pl-4 cursor-pointer hover:brightness-75" onClick={() => navigator.doNavigationRequest("home", {})}>Dashboard</h1>
            <div className="flex-grow"></div>
            <div className="flex flex-col text-center">
                <div className="italic">Hello {me.me.username}</div>
                <Link
                    className="cursor-pointer"
                    onClick={() => {
                        UsermgmtWebApi.logout()
                            .then(() => location.reload());
                    }}
                >Logout</Link>
            </div>
        </Toolbar>
    </AppBar>;
}
