import React from "react";
import NavigationBar from "../components/NavigationBar";
import UserView from "../components/UserView";

interface PageUsersProperties {
    setCurrentPage: (key: string) => void;
}

export default function PageUsers(props: PageUsersProperties) {
    return <div className="flex flex-col">
        <NavigationBar
            activePage="users"
            onNavigation={newPage => props.setCurrentPage(newPage)}
        />
        <UserView
            setCurrentPage={props.setCurrentPage}
        />
    </div>;
}
