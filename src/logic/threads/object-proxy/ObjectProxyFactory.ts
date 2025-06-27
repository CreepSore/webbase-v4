import IThreadMessageSender from "../IThreadMessageSender";
import IObjectProxyConnection from "./IObjectProxyConnection";
import ThreadSendingObjectProxyConnection from "./ThreadSendingObjectProxyConnection";

export default class ObjectProxyFactory {
    private static getPropertyType<T>(name: string, o: {prototype: T}): string {
        // @ts-ignore
        if(o.prototype[name]) {
            // @ts-ignore
            return typeof(o.prototype[name]);
        }

        if(o.prototype) {
            // @ts-ignore
            return this.getPropertyType(name, o.prototype);
        }

        return null;
    }

    static createSendProxy<T>(proxyObjectId: string, templateObject: {prototype: T}, sender: IThreadMessageSender): T {
        // @ts-ignore
        const result: T = {};
        const connection = new ThreadSendingObjectProxyConnection(proxyObjectId, sender);

        for(const propertyName of Object.getOwnPropertyNames(templateObject.prototype)) {
            if(propertyName === "constructor") {
                continue;
            }

            const descriptor = Object.getOwnPropertyDescriptor(templateObject.prototype, propertyName);

            if(descriptor.get || descriptor.set) {
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
            if(this.getPropertyType(propertyName, templateObject) === "function") {
                // @ts-ignore
                result[propertyName] = (...args) => {
                    return connection.call<any, any[]>(propertyName, ...args);
                };

                continue;
            }
        }

        return result;
    }
}
