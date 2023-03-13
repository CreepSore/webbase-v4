import CliApplication from "@app/CliApplication";
import IApplication from "@app/IApplication";
import MainApplication from "@app/MainApplication";

import minimist from "minimist";

(async() => {
    const args = minimist(process.argv.slice(2), {
        alias: {
            command: "c",
        },
        string: ["command"],
    });

    let app: IApplication;
    if(args.command === undefined) {
        app = new MainApplication();
    }
    else {
        app = new CliApplication(args);
    }

    try {
        await app.start();
    }
    catch(err) {
        console.log("CRITICAL", "app.ts", `Critical error occured: [${err.message}]`);
    }
})();
