import React from "react";
import LoginView from "../components/LoginView";

interface PageHomeProperties {
    setCurrentPage(key: string);
}

export default function PageHome(props: PageHomeProperties) {
    return <div className="flex flex-col">
        <LoginView onLogin={() => props.setCurrentPage("home")}/>
    </div>;
};
