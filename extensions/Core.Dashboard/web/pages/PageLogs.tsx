import React from "react";
import NavigationBar from "../components/NavigationBar";
import UserView from "../components/UserView";

import {useFetchJson, usePermissions} from "../hooks";

import DashboardPermission from "../../permissions";

interface LogEntry {
    id: string;
    date: number;
    level: string;
    infos: string[];
    message: string;
}

interface PageLogsProperties {
    setCurrentPage: (key: string) => void;
}

interface LogViewerProperties {
    lines: LogEntry[];
}

interface LogViewerLineProperties {
    line: LogEntry;
}

function LogViewerLine(props: LogViewerLineProperties) {
    let color = "text-gray-200";
    switch(props.line.level) {
        case "DEBUG": color = "text-gray-400"; break;
        case "WARN": color = "text-orange-300"; break;
        case "ERROR": color = "text-red-400"; break;
        case "CRITICAL": color = "text-red-600"; break;
    }

    return <tr className={`border-b border-gray-600 bg-slate-800 hover:border-gray-400 ${color}`}>
        <td onClick={e => window.getSelection().selectAllChildren(e.target as Node)}>{new Date(props.line.date).toISOString()}</td>
        <td onClick={e => window.getSelection().selectAllChildren(e.target as Node)}>{props.line.level}</td>
        <td onClick={e => window.getSelection().selectAllChildren(e.target as Node)}>{props.line.infos.map(info => `[${info}]`).join(" ")}</td>
        <td onClick={e => window.getSelection().selectAllChildren(e.target as Node)}>{props.line.message}</td>
    </tr>;
}

function LogViewer(props: LogViewerProperties) {
    let formattedLog = React.useMemo(() => props.lines?.join?.("\n") || "", [props.lines]);

    return <div className="h-full w-full font-[Consolas] text-sm">
        <table className="w-full">
            <tbody>
                {props.lines?.map?.(line => <LogViewerLine key={line.id} line={line} />)}
            </tbody>
        </table>
    </div>
}

export default function PageLogs(props: PageLogsProperties) {
    let [permViewLogs] = usePermissions(DashboardPermission.ViewLogs.name);
    let [, logs] = useFetchJson<LogEntry[]>("/api/core.dashboard/logs");

    if(!permViewLogs) {
        props.setCurrentPage("home");
        return;
    }

    return <div className="flex flex-col h-screen bg-slate-800">
        <NavigationBar
            activePage="logs"
            onNavigation={newPage => props.setCurrentPage(newPage)}
        />

        <LogViewer lines={logs}/>
    </div>;
}
