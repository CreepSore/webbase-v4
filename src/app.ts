import IApplication from "@app/IApplication";
import MainApplication from "@app/MainApplication";

(async() => {
    let app: IApplication = new MainApplication();
    await app.start();
})();
