import { NotificationProps } from "./index";
import * as uuid from "uuid";

interface NotificationState extends NotificationProps{
    id: string;
    showTimeMs: number;
    closeTimeMs: number;
    isClosing: boolean;
    deleteTimeMs?: number;
}

export default class NotificationManager {
    static notifications: NotificationState[] = [];
    static showTime: number = 5000;
    static closeTime: number = 500;
    static interval: NodeJS.Timer = null;

    static startWatching() {
        if(this.interval) return this;

        this.interval = setInterval(() => {
            const now = Date.now();

            this.notifications = this.notifications
                .filter(n => now > n.deleteTimeMs);

            this.notifications
                .filter(n => now > n.closeTimeMs)
                .forEach(n => {
                    n.isClosing = true;
                    n.deleteTimeMs = now + this.closeTime;
                });
        }, 250);
        return this;
    }

    static stopWatching() {
        clearInterval(this.interval);
        this.interval = null;
        return this;
    }

    static addNotification(notification: NotificationProps) {
        this.notifications.push({
            ...notification,
            id: uuid.v4(),
            showTimeMs: Date.now(),
            closeTimeMs: Date.now() + this.showTime,
            isClosing: false
        });
        return this;
    }

    static clearAllNotifications() {
        this.notifications = [];
        return this;
    }
}
