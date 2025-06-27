import { parentPort } from "worker_threads";

export default class ThreadMessage<TPayload> {
    sender: "main-thread" | "thread" | "auto";
    type: string;
    payload: TPayload;

    constructor(type: string, payload: TPayload, sender: ThreadMessage<TPayload>["sender"] = "auto") {
        this.sender = sender === "auto"
            ? (Boolean(parentPort) ? "thread" : "main-thread")
            : sender;

        this.type = type;
        this.payload = payload;
    }
}
