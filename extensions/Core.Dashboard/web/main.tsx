import React from "react";
import ReactDOM from "react-dom/client";
import * as knex from "knex";

import Router from "../../Core.ReactComponents/Router";
import RouterPage from "../../Core.ReactComponents/Router/RouterPage";
import PageHome from "./pages/PageHome";
import PageUsers from "./pages/PageUsers";
import PagePermissions from "./pages/PagePermissions";
import PageLogin from "./pages/PageLogin";
import PageLogs from "./pages/PageLogs";
import PageCustom from "./pages/PageCustom";

import {useDashboardPages} from "./hooks";

declare global {
    interface Window {
        runDbQuery<T>(query: string): Promise<T>;
    }
}

window.runDbQuery = query => {
    return new Promise((res, rej) => {
        fetch("/api/core.dashboard/db/query", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({query}),
        }).then(response => response.json())
            .then(data => {
                if(data.success === false) {
                    return rej();
                }

                return res(data);
            })
            .catch(() => {rej()});
    });
};

function Main() {
    let [currentPage, setCurrentPage] = React.useState("home");
    let customDashboardPages = useDashboardPages();
    let customPages = React.useMemo(() => {
        const result = customDashboardPages.map(cdp => <RouterPage key={cdp.key}>
            <PageCustom
                setCurrentPage={setCurrentPage}
                dashboardPage={cdp}
            />
        </RouterPage>);

        return result;
    }, [customDashboardPages]);

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

        <RouterPage key="logs">
            <PageLogs setCurrentPage={setCurrentPage} />
        </RouterPage>

        {customPages}
    </Router>;
}

window.addEventListener("load", () => {
    ReactDOM.createRoot(document.querySelector("#react-container") as Element).render(<Main />);
});
