import React from "react";
import ReactDOM from "react-dom/client";
import NavigationBar from "../components/NavigationBar";

import {DashboardPage} from "../../index";

interface PageHomeProperties {
    setCurrentPage: (key: string) => void;
    dashboardPage: DashboardPage;
}

export default function PageCustom(props: PageHomeProperties) {
    return <div className="flex flex-col h-screen">
        <NavigationBar
            activePage={props.dashboardPage.key}
            onNavigation={newPage => props.setCurrentPage(newPage)}
        />

        <iframe src={props.dashboardPage.url} className="flex-grow"></iframe>
    </div>;
};
