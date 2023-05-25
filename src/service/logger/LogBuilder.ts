import * as uuid from "uuid";
import ILogEntry from "./ILogEntry";

export default class LogBuilder {
    logEntry: ILogEntry;
    static onDone: (log: ILogEntry) => void;

    constructor() {
    }

    /**
     * This must only be called using decorators
     * @static
     * @memberof LogBuilder
     */
    static $logRuntime(appendCallstack: "debug"|"always"|"none" = "none"): MethodDecorator {
        return function(obj: any, symbol: string, desc: PropertyDescriptor) {
            const original = desc.value;

            desc.value = function(...args: any[]) {
                const startDate = new Date();

                const infoObj: {
                    args?: any,
                    return?: any,
                    startTime?: string,
                    endTime?: string,
                } = {
                    args,
                    startTime: startDate.toISOString(),
                    endTime: null,
                };

                const builder = LogBuilder
                    .start()
                    .level("INFO")
                    .info("LogRuntime");

                if(appendCallstack === "debug") {
                    builder.appendDebugCallStack();
                }
                else if(appendCallstack === "always") {
                    builder.appendCallStack();
                }

                const ret = original?.apply?.(this, args);
                const endDate = new Date();

                infoObj.return = ret;
                infoObj.endTime = endDate.toISOString();

                const execTime = endDate.getTime() - startDate.getTime();

                builder
                    .line(`Called ${obj.constructor.name}.${symbol}: ${execTime}ms`)
                    .object("info", infoObj)
                    .done();

                return ret;
            };
        };
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

    debugDone(): LogBuilder {
        if(process.env.DEBUG !== "true") return this;
        return this.done();
    }

    done(): LogBuilder {
        LogBuilder.onDone(this.logEntry);
        return this;
    }
}
