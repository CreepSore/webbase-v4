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
    let [lastClick, setLastClick] = React.useState(0);

    let onClick = (e: React.MouseEvent) => {
        window.getSelection().selectAllChildren(e.target as Node);
    };

    return <tr className={`border-b border-gray-600 bg-slate-800 hover:border-gray-400 ${color}`}>
        <td className="w-[0.1%] whitespace-nowrap pr-4" onClick={onClick}>{new Date(props.line.date).toLocaleString()}</td>
        <td className="w-[0.1%] whitespace-nowrap pr-4" onClick={onClick}>{props.line.level}</td>
        <td className="w-[0.1%] whitespace-nowrap pr-4" onClick={onClick}>{props.line.infos.map(info => `[${info}]`).join(" ")}</td>
        <td className="pr-4" onClick={e => window.getSelection().selectAllChildren(e.target as Node)}>{props.line.message}</td>
        <td className="w-[0.1%] whitespace-nowrap"></td>
    </tr>;
}

function LogViewer(props: LogViewerProperties) {
    const filterText = (text: string, searchText: string) => {
        if(!searchText) return true;

        let searchMode = searchText[0]
        if(["?", "!"].includes(searchText[0])) {
            try {
                const match = new RegExp(searchText.substring(1), "gi");
                if(searchMode === "?") return match.test(text);
                if(searchMode === "!") return !match.test(text);
                return false;
            }
            catch {
                return false;
            }
        }

        return text.toLowerCase().includes(searchText.toLowerCase());
    };

    const [search1, setSearch1] = React.useState("");
    const [search2, setSearch2] = React.useState("");
    const [search3, setSearch3] = React.useState("");
    const [search4, setSearch4] = React.useState("");

    const filteredLog = React.useMemo(() => {
        if(!props?.lines) return [];
        return props.lines.filter(line => {
            if(!filterText(new Date(line.date).toLocaleString(), search1)) return false;
            if(!filterText(line.level, search2)) return false;
            if(!filterText(line.infos.map(info => `[${info}]`).join(" "), search3)) return false;
            if(!filterText(line.message, search4)) return false;

            return true;
        });
    }, [props.lines, search1, search2, search3, search4]);

    return <div className="h-full w-full font-[Consolas] text-sm">
        <table className="w-full">
            <thead>
                <tr>
                    <th><input
                        className="w-full px-2 py-1"
                        type="text"
                        value={search1}
                        onChange={e => setSearch1(e.target.value)}
                        placeholder="Date"
                        title="Prefix search with '?' to enable regex or '?' to negate search"
                    /></th>
                    <th><input
                        className="w-full px-2 py-1"
                        type="text"
                        value={search2}
                        onChange={e => setSearch2(e.target.value)}
                        placeholder="Level"
                        title="Prefix search with '?' to enable regex or '?' to negate search"
                    /></th>
                    <th><input
                        className="w-full px-2 py-1"
                        type="text"
                        value={search3}
                        onChange={e => setSearch3(e.target.value)}
                        placeholder="Segments"
                        title="Prefix search with '?' to enable regex or '?' to negate search"
                    /></th>
                    <th><input
                        className="w-full px-2 py-1"
                        type="text"
                        value={search4}
                        onChange={e => setSearch4(e.target.value)}
                        placeholder="Message"
                        title="Prefix search with '?' to enable regex or '?' to negate search"
                    /></th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                {filteredLog.map(line => <LogViewerLine key={line.id} line={line} />)}
            </tbody>
        </table>
    </div>
}


export default function PageLogs(props: PageLogsProperties) {
    let [permViewLogs] = usePermissions(DashboardPermission.ViewLogs.name);
    let [, logs, updateLogs] = useFetchJson<LogEntry[]>("/api/core.dashboard/logs");
    let containerRef = React.useRef<HTMLDivElement>();
    let [scroll, setScroll] = React.useState(containerRef.current?.scrollTop || 0);

    if(!permViewLogs) {
        props.setCurrentPage("home");
        return;
    }

    React.useEffect(() => {
        if(!containerRef.current) return;

        let cb = () => {
            setScroll(containerRef.current.scrollTop);
        };

        containerRef.current.addEventListener("scroll", cb);
        return () => window.removeEventListener("scroll", cb);
    }, [containerRef.current]);

    return <div className="flex flex-col h-screen bg-slate-800 overflow-x-auto" ref={containerRef}>
        <NavigationBar
            activePage="logs"
            onNavigation={newPage => props.setCurrentPage(newPage)}
        />

        <LogViewer lines={logs}/>

        <div className="z-50 fixed right-4 bottom-4 flex flex-row items-end gap-2">
            <button
                className="bg-white/50 text-white rounded-full w-16 h-16 text-lg border border-transparent hover:border-white"
                onClick={() => containerRef.current?.scrollTo?.({top: scroll === 0 ? 999999 : 0})}
            >{scroll === 0 ? "D" : "U"}</button>

            <button
                className="bg-white/50 text-white rounded-full w-16 h-16 text-lg border border-transparent hover:border-white"
                onClick={() => updateLogs()}
            >Reload</button>
        </div>
        
    </div>;
}
