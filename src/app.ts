import ChildApplication from "@app/ChildApplication";
import CliApplication from "@app/CliApplication";
import IApplication from "@app/IApplication";
import MainApplication from "@app/MainApplication";

import minimist from "minimist";


(async() => {
    const args = minimist(process.argv.slice(2), {
        alias: {
            cli: "c",
        },
        string: ["childApp"],
        "boolean": ["cli"],
    });

    // ! Keep in mind that __filename should NOT work here.
    // ! It does work however, because we bundle to CommonJS Modules instead of ES-Modules
    ChildApplication.initializeStaticClass(__filename);

    let app: IApplication;
    if(args.cli) {
        app = new CliApplication(args);
    }
    else if(args.childApp) {
        app = new ChildApplication(args.childApp);
    }
    else {
        app = new MainApplication();
    }

    try {
        await app.start();
    }
    catch(err) {
        console.log("CRITICAL", "app.ts", `Critical error occured: [${err.message}]\n${err.stack}`);
    }
})();
