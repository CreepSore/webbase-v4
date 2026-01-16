import React from "react";
import ReactDOM from "react-dom/client";

import "./style.scss";
import {createTheme} from "@mui/material/styles";
import ThemeProvider from "@mui/system/ThemeProvider";

function Main(): React.ReactElement {
    const theme = createTheme({
        palette: {
            mode: "dark",
        },
    });

    return <ThemeProvider theme={theme}>

    </ThemeProvider>;
}

window.addEventListener("load", () => {
    document.title = "Template";
    ReactDOM.createRoot(document.querySelector("#react-container") as Element).render(<Main />);
});

