import React from "react";
import LoginView from "../components/LoginView";

import {invalidateLogonInfo, invalidateDashboardPages} from "../hooks";

interface PageHomeProperties {
    setCurrentPage: (key: string) => void;
}

export default function PageHome(props: PageHomeProperties) {
    return <div className="flex flex-col min-h-screen bg-slate-800 text-slate-400">
        <LoginView onLogin={() => {
            invalidateLogonInfo();
            invalidateDashboardPages();
            props.setCurrentPage("home");
        }}/>
    </div>;
};
