import * as perfHooks from "perf_hooks";

import * as uuid from "uuid";
import ILogEntry from "./ILogEntry";

/**
 * Provides a builder pattern for creating structured log entries.
 * It supports adding various log information like level, messages, and objects, and can measure method execution times.
 */
export default class LogBuilder {
    static readonly LogLevel = {
        NOTE: "NOTE",
        INFO: "INFO",
        ERROR: "ERROR",
        WARN: "WARN",
        CRITICAL: "CRITICAL",
    } as const;

    static onDone: LogBuilder["onDone"];

    logEntry: ILogEntry;
    onDone: (log: ILogEntry) => Promise<void>;

    defaultValues: Partial<ILogEntry>;

    constructor(
        defaultValues: Partial<ILogEntry> = null,
        onDone: LogBuilder["onDone"] = LogBuilder.onDone,
    ) {
        this.onDone = onDone;
        this.defaultValues = defaultValues;
        this.resetLogEntry();
    }

    /**
     * Decorator for logging the execution time of a synchronous method. Optionally logs call stack.
     * @param {("debug"|"always"|"none")} appendCallstack Controls when to append the call stack (debug, always, none).
     * @param {string[]} infos Additional information to be included in the log.
     */
    static $logRuntime(appendCallstack: "debug"|"always"|"none" = "none", infos: string[] = []): MethodDecorator {
        return function(obj: any, symbol: string, desc: PropertyDescriptor) {
            const original = desc.value;

            desc.value = function(...args: any[]) {
                const infoObj: {
                    args?: any,
                    return?: any,
                    startTime?: string,
                    endTime?: string,
                } = {
                    args,
                };

                const builder = LogBuilder
                    .start()
                    .level(LogBuilder.LogLevel.INFO);

                if(infos.length > 0) {
                    builder.info(...infos);
                }
                else {
                    builder.info("LogRuntime");
                }

                const startTime = perfHooks.performance.now();
                const ret = original?.apply?.(this, args);
                const endTime = perfHooks.performance.now();
                infoObj.return = ret;

                builder
                    .line(`Called ${obj.constructor.name}.${symbol}: ${endTime - startTime}ms`);

                if(appendCallstack === "debug") {
                    builder.appendDebugCallStack();
                }
                else if(appendCallstack === "always") {
                    builder.appendCallStack();
                }

                builder
                    .object("info", infoObj)
                    .done();

                return ret;
            };
        };
    }

    /**
     * Decorator for logging the execution time of an asynchronous method (returning a Promise). Optionally logs call stack.
     * @param {("debug"|"always"|"none")} appendCallstack Controls when to append the call stack (debug, always, none).
     * @param {string[]} infos Additional information to be included in the log.
     */
    static $logRuntimePromise(appendCallstack: "debug"|"always"|"none" = "none", infos: string[] = []): MethodDecorator {
        return function(obj: any, symbol: string, desc: PropertyDescriptor) {
            const original = desc.value;

            desc.value = function(...args: any[]) {
                const infoObj: {
                    args?: any,
                    return?: any,
                    startTime?: string,
                    endTime?: string,
                } = {
                    args,
                };

                const builder = LogBuilder
                    .start()
                    .level(LogBuilder.LogLevel.INFO);

                if(infos.length > 0) {
                    builder.info(...infos);
                }
                else {
                    builder.info("LogRuntime");
                }

                const startTime = perfHooks.performance.now();
                let ret = original?.apply?.(this, args);
                const callback = (pRet: any): any => {
                    const endTime = perfHooks.performance.now();
                    infoObj.return = pRet;

                    builder
                        .line(`Resolved Promise ${obj.constructor.name}.${symbol}: ${endTime - startTime}ms`);

                    if(appendCallstack === "debug") {
                        builder.appendDebugCallStack();
                    }
                    else if(appendCallstack === "always") {
                        builder.appendCallStack();
                    }

                    builder
                        .object("info", infoObj)
                        .done();
                    return pRet;
                };

                if(ret.then) {
                    ret = ret.then((pRet: any) => callback(pRet));
                }
                else {
                    callback(ret);
                }

                return ret;
            };
        };
    }

    /**
     * Starts building a new log entry. Intended to be the initial method called when using the builder.
     * @returns {LogBuilder} The instance of LogBuilder for method chaining.
     */
    static start(): LogBuilder {
        return new LogBuilder().start();
    }

    /**
     * Initializes a new log entry object with a unique ID, current date, and empty collections for infos, lines, and objects.
     * @returns {LogBuilder} The instance of LogBuilder for method chaining.
     */
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

    /**
     * Sets the log level of the current log entry.
     * @param {string} level The log level (e.g., "INFO", "ERROR").
     * @returns {LogBuilder} The instance of LogBuilder for method chaining.
     */
    level(level: string): LogBuilder {
        this.logEntry.level = level.toUpperCase();
        return this;
    }

    /**
     * Adds informational segments to the current log entry.
     * @param {...string[]} infos The informational segment to add.
     * @returns {LogBuilder} The instance of LogBuilder for method chaining.
     */
    info(...infos: string[]): LogBuilder {
        this.logEntry.infos.push(...infos);
        return this;
    }

    /**
     * Adds lines of text to the current log entry.
     * @param {...string[]} lines The lines of text to add.
     * @returns {LogBuilder} The instance of LogBuilder for method chaining.
     */
    line(...lines: string[]): LogBuilder {
        this.logEntry.lines.push(...lines);
        return this;
    }

    /**
     * Adds an object to the current log entry for detailed inspection. The object is identified by a name.
     * @param {string} name The name identifying the object.
     * @param {any} object The object to add.
     * @returns {LogBuilder} The instance of LogBuilder for method chaining.
     */
    object(name: string, object: any): LogBuilder {
        if(!object) return this;
        this.logEntry.objects[name] = object;
        return this;
    }

    /**
     * Adds a debug object to the current log entry if the DEBUG environment variable is set to "true".
     * This method is similar to `object` but conditional on the debug setting.
     * @param {string} name The name identifying the debug object.
     * @param {any} object The debug object to add.
     * @returns {LogBuilder} The instance of LogBuilder for method chaining.
     */
    debugObject(name: string, object: any): LogBuilder {
        if(process.env.DEBUG !== "true") return this;
        if(!object) return this;
        this.logEntry.objects[name] = object;
        return this;
    }

    /**
     * Appends the call stack to the current log entry. Useful for debugging to trace where the log was generated.
     * @returns {LogBuilder} The instance of LogBuilder for method chaining.
     */
    appendCallStack(): LogBuilder {
        const {stack} = new Error();
        const lines = stack.split("\n");
        lines[0] = "Call-Stack:";
        lines.splice(1, 1);
        this.line(...lines);
        return this;
    }

    /**
     * Appends the call stack to the current log entry if the DEBUG environment variable is set to "true".
     * @returns {LogBuilder} The instance of LogBuilder for method chaining.
     */
    appendDebugCallStack(): LogBuilder {
        if(process.env.DEBUG !== "true") return this;
        return this.appendCallStack();
    }

    /**
     * Marks the completion of the log entry building process and triggers the `onDone` callback with the constructed log entry.
     * Intended to be the final method called when using the builder.
     * @returns {LogBuilder} The instance of LogBuilder for chaining, although typically this should be the final operation.
     */
    debugDone(): Promise<void> {
        if(process.env.DEBUG !== "true") return Promise.resolve();
        return this.done();
    }

    /**
     * Marks the completion of the log entry building process and triggers the `onDone` callback with the constructed log entry.
     * Intended to be the final method called when using the builder.
     * @returns {LogBuilder} The instance of LogBuilder for chaining, although typically this should be the final operation.
     */
    done(): Promise<void> {
        return this.onDone?.(this.logEntry);;
    }

    resetLogEntry(): void {
        this.logEntry = {
            id: this.defaultValues?.id || uuid.v4(),
            date: this.defaultValues?.date || new Date(),
            infos: [...(this.defaultValues?.infos || [])],
            lines: [...(this.defaultValues?.lines || [])],
            objects: {...(this.defaultValues?.objects || {})},
        };
    }
}
