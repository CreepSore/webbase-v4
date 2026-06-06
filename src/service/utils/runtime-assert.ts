class RuntimeAssertionError extends Error {
    constructor(message: string) {
        const name = "RuntimeAssertionError";
        super(`${name}: ${message}`);
        this.name = name;
    }
}

export default class RuntimeAssert {
    static assertDefined<T>(t: T, name?: string): asserts t is NonNullable<T> {
        if(t === null || t === undefined) {
            throw new RuntimeAssertionError(`${name || "value"} is null or undefined`);
        }
    }

    static assert(condition: boolean, message?: string): asserts condition {
        if(!condition) {
            throw new RuntimeAssertionError(`${message || "condition is false"}`);
        }
    }

    static fail(): never {
        throw new RuntimeAssertionError("Failure");
    }
}
