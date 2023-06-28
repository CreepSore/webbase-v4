import LogBuilder from "@service/logger/LogBuilder";

/**
 * This must only be called using decorators
 * @memberof LogBuilder
 */
export function $catchPromise(
    appendCallstack: "debug"|"always"|"none" = "always",
    infos: string[] = [],
    defaultValue?: any,
): MethodDecorator {
    return function(obj: any, symbol: string, desc: PropertyDescriptor) {
        const original = desc.value;

        desc.value = function(...args: any[]) {
            const ret = original?.apply?.(this, args);

            if(ret.then && ret.catch) {
                ret.catch(() => {
                    const builder = LogBuilder
                        .start()
                        .level("ERROR");

                    if(infos.length > 0) {
                        builder.info(...infos);
                    }
                    else {
                        builder.info("LogRuntime");
                    }

                    builder
                        .line(`Promise created by ${obj.constructor.name}.${symbol} was rejected.`);

                    if(appendCallstack === "debug") {
                        builder.appendDebugCallStack();
                    }
                    else if(appendCallstack === "always") {
                        builder.appendCallStack();
                    }

                    builder.done();

                    if(defaultValue !== undefined) {
                        return defaultValue;
                    }
                });
            }

            return ret;
        };
    };
}
