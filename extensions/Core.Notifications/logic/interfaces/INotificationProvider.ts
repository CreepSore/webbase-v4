import INotification from "./INotification";

export default interface INotificationProvider {
    type: string;
    start(): Promise<void>;
    stop(): Promise<void>;
    broadcastNotification(message: INotification): Promise<void>;
    sendNotification<T = any>(target: T, message: INotification): Promise<void>;
}
