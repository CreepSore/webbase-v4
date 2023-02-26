import React from "react";
import NotificationManager from "./NotificationManager";

import "./style.css";

export interface NotificationProps {
    type: "info" | "success" | "warn" | "error";
    title: string;
    message: string;
}

function Notification(props: NotificationProps) {
    return <div className={`notification ${props.type}`}>
        {props.message}
    </div>;
}

export default function Notifications() {
    const notifications = React.useMemo(() => NotificationManager.notifications, [NotificationManager.notifications]);

    return <div className="notifications">
        {notifications.map(n => <Notification key={n.id} message={n.message} title={n.title} type={n.type} />)}
    </div>;
}
