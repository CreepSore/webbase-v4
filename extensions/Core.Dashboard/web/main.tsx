import React from "react";
import ReactDOM from "react-dom/client";

import "./style.css";

function Main(): JSX.Element {
    return <></>;
}

window.addEventListener("load", () => {
    ReactDOM.createRoot(document.querySelector("#react-container") as Element).render(<Main />);
});

