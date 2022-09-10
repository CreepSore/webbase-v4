import React from "react";
import ReactDOM from "react-dom/client";

import Router from "../../Core.ReactComponents/Router";
import RouterPage from "../../Core.ReactComponents/Router/RouterPage";
import PageHome from "./pages/PageHome";

function Main() {
    let [currentPage, setCurrentPage] = React.useState("home");

    return <Router currentPage={currentPage}>
        <RouterPage key="home">
            <PageHome />
        </RouterPage>
    </Router>;
}

window.addEventListener("load", () => {
    ReactDOM.createRoot(document.querySelector("#react-container") as Element).render(<Main />);
});
