import React from "react";
import NavigationBar from "../components/NavigationBar";
import UserView from "../components/UserView";
import WidgetView from "../components/WidgetView";

interface PageHomeProperties {
    setCurrentPage: (key: string) => void;
}

export default function PageHome(props: PageHomeProperties) {
    return <div className="flex flex-col min-h-screen bg-slate-800 text-slate-400">
        <NavigationBar
            activePage="home"
            onNavigation={newPage => props.setCurrentPage(newPage)}
        />

        <WidgetView />
    </div>;
};
