import IApplication from "@app/IApplication";
import MainApplication from "@app/MainApplication";

(async() => {
    let app: IApplication = new MainApplication();
    try {
        await app.start();
    }
    catch(err) {
        console.log("CRITICAL", "app.ts", `Critical error occured: [${err.message}]`);
    }
})();
