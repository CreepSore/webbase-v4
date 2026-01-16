import * as React from "react";
import BasePage from "../BasePage/BasePage";
import { Card, Container, PaletteColor, Paper, Typography, useTheme } from "@mui/material";
import { Person, Security } from "@mui/icons-material";
import NavigatorContext from "../../../../Core.React/Navigator/NavigatorContext";
import { twMerge } from "tailwind-merge";
import PermissionCheck from "../../../../Core.Usermgmt.Web/web/components/PermissionCheck";
import Permissions from "@extensions/Core.Usermgmt/permissions";


type ResponsiveCardProperties = {
    icon: React.ReactElement;
    label: string;
    onClick: () => void;
    color?: "inherit"
        | "action"
        | "disabled"
        | "primary"
        | "secondary"
        | "error"
        | "info"
        | "success"
        | "warning";
};

function ResponsiveCard({icon, label, color, onClick}: ResponsiveCardProperties): React.ReactElement {
    const theme = useTheme();
    const clr = theme.palette[color as keyof typeof theme.palette] as PaletteColor;

    const [isMouseDown, setIsMouseDown] = React.useState(false);

    return <Card
        className={twMerge(
            "flex justify-around items-center relative py-6 select-none cursor-pointer",
            isMouseDown ? "brightness-75" : "",
        )}
        variant="elevation"
        elevation={isMouseDown ? 3 : 5}
        onClick={onClick}
        onMouseDown={() => setIsMouseDown(true)}
        onMouseUp={() => setIsMouseDown(false)}
        style={{
            backgroundColor: clr?.main,
        }}
    >
        <div style={{color: clr?.contrastText}}>
            {icon}
        </div>

        <div className="text-center">
            <Typography variant="h5" color={clr?.contrastText}>{label}</Typography>
        </div>

        <div></div>
    </Card>;
}

export default function HomePage(): React.ReactElement {
    const navigator = React.useContext(NavigatorContext);

    return <BasePage>
        <Container>
            <Paper className="mt-2 p-4" elevation={3}>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <PermissionCheck permissions={[Permissions.USERS.VIEW]}>
                        <ResponsiveCard
                            label="Users"
                            icon={<Person style={{fontSize: "3.5em"}} />}
                            onClick={() => navigator.doNavigationRequest("users", {})}
                            color="success"
                        />
                    </PermissionCheck>

                    <PermissionCheck permissions={[Permissions.PERMISSIONS.VIEW]}>
                        <ResponsiveCard
                            label="Permissions"
                            icon={<Security style={{fontSize: "3em"}} />}
                            onClick={() => navigator.doNavigationRequest("permissions", {})}
                            color="warning"
                        />
                    </PermissionCheck>
                </div>
            </Paper>
        </Container>
    </BasePage>;
}
