export default class TestUtils {
    static waitUntil(check: () => boolean | Promise<boolean>, timeout: number = 5000): Promise<boolean> {
        return new Promise(async(resolve) => {
            const startTime = Date.now();

            if(await check()) {
                resolve(true);
                return;
            }

            const interval = setInterval(async () => {
                if (await check()) {
                    clearInterval(interval);
                    resolve(true);
                } else if (Date.now() - startTime > timeout) {
                    clearInterval(interval);
                    resolve(false);
                }
            }, 100);
        });
    }
}
