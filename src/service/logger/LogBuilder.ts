import * as uuid from "uuid";
import ILogEntry from "./ILogEntry";

export default class LogBuilder {
    logEntry: ILogEntry;
    static onDone: (log: ILogEntry) => void;

    constructor() {
    }

    static start(): LogBuilder {
        return new LogBuilder().start();
    }

    start(): LogBuilder {
        this.logEntry = {
            id: uuid.v4(),
            date: new Date(),
            infos: [],
            lines: [],
            objects: {},
        };
        return this;
    }

    level(level: string): LogBuilder {
        this.logEntry.level = level.toUpperCase();
        return this;
    }

    info(...infos: string[]): LogBuilder {
        this.logEntry.infos.push(...infos);
        return this;
    }

    line(...lines: string[]): LogBuilder {
        this.logEntry.lines.push(...lines);
        return this;
    }

    object(name: string, object: any): LogBuilder {
        if(!object) return this;
        this.logEntry.objects[name] = object;
        return this;
    }

    debugObject(name: string, object: any): LogBuilder {
        if(process.env.DEBUG !== "true") return this;
        if(!object) return this;
        this.logEntry.objects[name] = object;
        return this;
    }

    appendCallStack(): LogBuilder {
        const {stack} = new Error();
        const lines = stack.split("\n");
        lines[0] = "Call-Stack:";
        lines.splice(1, 1);
        this.line(...lines);
        return this;
    }

    appendDebugCallStack(): LogBuilder {
        if(process.env.DEBUG !== "true") return this;
        return this.appendCallStack();
    }

    done(): LogBuilder {
        LogBuilder.onDone(this.logEntry);
        return this;
    }
}
