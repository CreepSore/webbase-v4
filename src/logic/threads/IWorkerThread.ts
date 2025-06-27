import IThreadMessageReceiver from "./IThreadMessageReceiver";
import IThreadMessageSender from "./IThreadMessageSender";
import ThreadMessage from "./ThreadMessage";

export default interface IWorkerThread extends IThreadMessageSender, IThreadMessageReceiver {
    get id(): string;
    get isStarted(): boolean;

    start(): Promise<void>;
    stop(): Promise<void>;

    registerProxy<T>(proxyType: string, object: T, proxyId: string): Promise<string>;
    getProxy<T>(proxyId: string, templateObject: {prototype: T}): T;
    getStaticProxy<T>(proxyId: string, templateObject: {prototype: T}): T;
}