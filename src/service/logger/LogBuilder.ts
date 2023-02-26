import * as uuid from "uuid";
import ILogEntry from "./ILogEntry";

export default class LogBuilder {
    logEntry: ILogEntry;
    static onDone: (log: ILogEntry) => void;

    constructor() {
    }

    static start() {
        return new LogBuilder().start();
    }

    start() {
        this.logEntry = {
            id: uuid.v4(),
            date: new Date(),
            infos: [],
            lines: [],
            objects: {}
        };
        return this;
    }

    level(level: string) {
        this.logEntry.level = level.toUpperCase();
        return this;
    }

    info(info: string) {
        this.logEntry.infos.push(info);
        return this;
    }

    line(line: string) {
        this.logEntry.lines.push(line);
        return this;
    }

    object(name: string, object: any) {
        if(!object) return this;
        this.logEntry.objects[name] = object;
        return this;
    }

    debugObject(name: string, object: any) {
        if(process.env.DEBUG !== "true") return this;
        if(!object) return this;
        this.logEntry.objects[name] = object;
        return this;
    }

    done() {
        LogBuilder.onDone(this.logEntry);
        return this;
    }
}
