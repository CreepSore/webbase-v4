import React from "react";
import ReactDOM from "react-dom/client";

import Router from "../../Core.ReactComponents/Router";
import RouterPage from "../../Core.ReactComponents/Router/RouterPage";
import PageHome from "./pages/PageHome";
import PageUsers from "./pages/PageUsers";
import PagePermissions from "./pages/PagePermissions";
import PageLogin from "./pages/PageLogin";

function Main() {
    let [currentPage, setCurrentPage] = React.useState("users");

    return <Router currentPage={currentPage}>
        <RouterPage key="home">
            <PageHome setCurrentPage={setCurrentPage} />
        </RouterPage>

        <RouterPage key="users">
            <PageUsers setCurrentPage={setCurrentPage} />
        </RouterPage>

        <RouterPage key="permissions">
            <PagePermissions setCurrentPage={setCurrentPage} />
        </RouterPage>

        <RouterPage key="login">
            <PageLogin setCurrentPage={setCurrentPage} />
        </RouterPage>
    </Router>;
}

window.addEventListener("load", () => {
    ReactDOM.createRoot(document.querySelector("#react-container") as Element).render(<Main />);
});
