import React from "react";
import NavigationBar from "../components/NavigationBar";
import UserView from "../components/UserView";

interface PageHomeProperties {
    setCurrentPage: (key: string) => void;
}

export default function PageHome(props: PageHomeProperties) {
    return <div className="flex flex-col">
        <NavigationBar
            activePage="home"
            onNavigation={newPage => props.setCurrentPage(newPage)}
        />
    </div>;
};
