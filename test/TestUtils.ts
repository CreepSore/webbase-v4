export default class TestUtils {
    static waitUntil(check: () => boolean | Promise<boolean>, timeout: number = 5000): Promise<boolean> {
        return new Promise(async(resolve) => {
            const startTime = Date.now();

            if(await check()) {
                resolve(true);
                return;
            }

            const interval = setInterval(async() => {
                if (await check()) {
                    clearInterval(interval);
                    resolve(true);
                }
                else if (Date.now() - startTime > timeout) {
                    clearInterval(interval);
                    resolve(false);
                }
            }, 100);
        });
    }

    static timedAwait<T>(promise: Promise<T>, timeout: number): Promise<T | null> {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject();
            }, timeout);

            promise.then((result) => {
                clearTimeout(timer);
                resolve(result);
            }).catch((err) => {
                clearTimeout(timer);
                reject(err);
            });
        });
    }
}
