import CliApplication from "@app/CliApplication";
import IApplication from "@app/IApplication";
import MainApplication from "@app/MainApplication";

import minimist from "minimist";
import { EnvironmentLoader } from "./service/environment/EnvironmentLoader";
import ConsoleLogger from "./service/logger/ConsoleLogger";
import Thread from "./logic/threads/Thread";
import ThreadApplication from "./application/ThreadApplication";

const setupEnvironment = async(log: boolean) => {
    const consoleLogger = new ConsoleLogger();
    const scanDirs = [
        {
            path: ".",
            recursive: false
        },
        {
            path: "./.env",
            recursive: true
        },
        {
            path: "./env",
            recursive: true
        }
    ] as const;

    for(const dir of scanDirs) {
        try {
            const parsedDir = await EnvironmentLoader.loadFromDirectoryAsync(dir.path, dir.recursive);

            if(parsedDir.errors.length > 0) {
                consoleLogger.logSync({
                    id: "",
                    level: "ERROR",
                    date: new Date(),
                    infos: ["AppLoader", "Environment"],
                    lines: [`Failed loading .env files:`, parsedDir.errors.join("\n\n")],
                    objects: {}
                });
            }

            for(const file of parsedDir.files) {
                if(log) {
                    consoleLogger.logSync({
                        id: "",
                        date: new Date(),
                        infos: ["AppLoader", "Environment"],
                        lines: [`Loaded .env file [${file.identifier}]`],
                        objects: {}
                    });
                }
                file.apply();
            }
        }
        catch {
            // ! Directory does not exist. We don't care about that
        }
    }
};

(async() => {
    Thread.scriptPath = module.filename;

    const args = minimist(process.argv.slice(2), {
        alias: {
            cli: "c",
        },
        string: ["cli"],
        "boolean": ["worker"],
    });

    Thread.scriptPath = __filename;

    let app: IApplication;
    if(args.cli) {
        await setupEnvironment(false);
        app = new CliApplication(args);
    }
    else if(args.worker) {
        await setupEnvironment(true);
        app = new ThreadApplication();
    }
    else {
        await setupEnvironment(true);
        app = new MainApplication();
    }

    try {
        await app.start();
    }
    catch(err) {
        console.log("CRITICAL", "app.ts", `Critical error occured: [${err.message}]\n${err.stack}`);
    }
})();
