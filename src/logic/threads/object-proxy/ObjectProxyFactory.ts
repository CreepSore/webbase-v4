import IThreadMessageSender from "../IThreadMessageSender";
import IObjectProxyConnection from "./IObjectProxyConnection";
import ThreadSendingObjectProxyConnection from "./ThreadSendingObjectProxyConnection";

export default class ObjectProxyFactory {
    private static getPropertyType<T>(name: string, o: {prototype: T}): string {
        // @ts-ignore
        if(o[name]) {
            // @ts-ignore
            return typeof(o[name]);
        }

        if(o) {
            // @ts-ignore
            return this.getPropertyType(name, o.prototype || o.__proto__);
        }

        return null;
    }

    static createStaticSendProxy<T>(proxyObjectId: string, templateObject: {prototype: T}, sender: IThreadMessageSender): {proxy: T, connection: ThreadSendingObjectProxyConnection} {
        // @ts-ignore
        let result: T = {};
        let prototype = templateObject;
        const connection = new ThreadSendingObjectProxyConnection(proxyObjectId, sender);

        while(prototype) {
            for(const propertyName of Object.getOwnPropertyNames(prototype)) {
                if(propertyName === "constructor") {
                    continue;
                }

                const descriptor = Object.getOwnPropertyDescriptor(prototype, propertyName);

                // @ts-ignore
                if(typeof(descriptor.value) === "function") {
                    // @ts-ignore
                    result[propertyName] = (...args) => {
                        return connection.call<any, any[]>(propertyName, ...args);
                    };

                    continue;
                }

                if(descriptor.get || descriptor.set || descriptor.enumerable) {
                    if(Object.getOwnPropertyDescriptor(result, propertyName)) {
                        continue;
                    }

                    Object.defineProperty(result, propertyName, {
                        get: () => {
                            return connection.get(propertyName);
                        },
                        set: (value) => {
                            return connection.set(propertyName, value);
                        }
                    });

                    continue;
                }
            }

            // @ts-ignore
            prototype = prototype.__proto__ || null;
        }

        return {proxy: result, connection};
    }

    static createSendProxy<T>(proxyObjectId: string, templateObject: {prototype: T}, sender: IThreadMessageSender): {proxy: T, connection: ThreadSendingObjectProxyConnection} {
        // @ts-ignore
        let result: T = {};
        let prototype = templateObject.prototype;
        const connection = new ThreadSendingObjectProxyConnection(proxyObjectId, sender);

        while(prototype) {
            for(const propertyName of Object.getOwnPropertyNames(prototype)) {
                if(propertyName === "constructor") {
                    continue;
                }

                const descriptor = Object.getOwnPropertyDescriptor(prototype, propertyName);

                if(descriptor.get || descriptor.set) {
                    if(Object.getOwnPropertyDescriptor(result, propertyName)) {
                        continue;
                    }

                    Object.defineProperty(result, propertyName, {
                        get: () => {
                            return connection.get(propertyName);
                        },
                        set: (value) => {
                            return connection.set(propertyName, value);
                        }
                    });

                    continue;
                }

                // @ts-ignore
                if(this.getPropertyType(propertyName, prototype) === "function") {
                    // @ts-ignore
                    result[propertyName] = (...args) => {
                        return connection.call<any, any[]>(propertyName, ...args);
                    };

                    continue;
                }
            }

            // @ts-ignore
            prototype = prototype.prototype || null;
        }

        return {proxy: result, connection};
    }
}
