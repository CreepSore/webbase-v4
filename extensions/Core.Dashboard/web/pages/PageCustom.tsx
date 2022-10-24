import React from "react";
import ReactDOM from "react-dom/client";
import NavigationBar from "../components/NavigationBar";

import {DashboardPage} from "../hooks";

interface PageHomeProperties {
    setCurrentPage: (key: string) => void;
    dashboardPage: DashboardPage;
}

export default function PageCustom(props: PageHomeProperties) {
    let [loaded, setLoaded] = React.useState(null);
    
    React.useEffect(() => {
        (async() => {
            const scriptUrl = props.dashboardPage.scriptUrl;
            window.React = React;
            (await import(/* webpackIgnore: true */scriptUrl));
            setLoaded(true);
        })();
    }, [props.dashboardPage.scriptUrl]);

    return <div className="flex flex-col">
        <NavigationBar
            activePage={props.dashboardPage.key}
            onNavigation={newPage => props.setCurrentPage(newPage)}
        />

        <div id="dashboard-react-container">
            {/*
            // @ts-ignore */}
            {loaded && <window.loaded />}
        </div>
    </div>;
};
