import CoreMail from "@extensions/Core.Mail";
import INotification from "@extensions/Core.Notifications/logic/interfaces/INotification";
import INotificationProvider from "@extensions/Core.Notifications/logic/interfaces/INotificationProvider";

export default class MailNotificationProvider implements INotificationProvider {
    type: string = "MAIL";
    coreMail: CoreMail;

    constructor(coreMail: CoreMail) {
        this.coreMail = coreMail;
    }

    async start(): Promise<void> {

    }

    async stop(): Promise<void> {

    }

    async broadcastNotification(message: INotification): Promise<void> {
        await this.coreMail.sendAlertMail({
            subject: message.title,
            text: message.message,
        });
    }

    async sendNotification<T = any>(target: T, message: INotification): Promise<void> {
        if(typeof target !== "string") {
            return;
        }

        await this.coreMail.sendMail("ALERT", {
            subject: message.title,
            text: message.message,
            to: target as string,
        });
    }
}
