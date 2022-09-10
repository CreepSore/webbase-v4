import * as fs from "fs";
import {EventEmitter} from "events";
import {Server} from "net";

import * as express from "express";
import * as uuid from "uuid";

import IExecutionContext from "@service/extensions/IExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import ConfigLoader from "@logic/config/ConfigLoader";

class CoreWebConfig {
    hostname: string = "127.0.0.1";
    port: number = 1325;
}

export default class CoreWeb implements IExtension {
    metadata: ExtensionMetadata = {
        name: "Core.Web",
        version: "1.0.0",
        description: "Core Web Module",
        author: "ehdes",
        dependencies: ["Core"]
    };

    config: CoreWebConfig;
    app: express.Express;
    server: Server;
    configLoader: ConfigLoader<typeof this.config>;
    events: EventEmitter = new EventEmitter();

    constructor() {
        this.config = this.loadConfig();
    }

    async start(executionContext: IExecutionContext) {
        if(executionContext.contextType === "cli") return;
        if(!this.config) {
            throw new Error(`Config not found at [${this.configLoader.configPath}]`);
        }

        this.app = express();
        this.events.emit("express-loaded", this.app);
        this.server = this.app.listen(this.config.port, this.config.hostname);
    }

    async stop() {
        this.server.removeAllListeners();
        this.server.close();
    }

    private loadConfig() {
        this.configLoader = new ConfigLoader(ConfigLoader.createConfigPath("Core.Web.json"), ConfigLoader.createConfigPath("Core.Web.template.json"));
        let cfg = this.configLoader.createTemplateAndImport(new CoreWebConfig());

        return cfg;
    }

    onExpressLoaded(callback: (app: express.Express) => void) {
        this.events.on("express-loaded", callback);
    }

    addAppRoute(routeUrl: string, scriptUrl: string) {
        this.app.get(routeUrl, (req, res) => {
            res.send(this.generateReactPage(scriptUrl)).end();
        });
    }

    addScript(name: string, source: string | any, url: string = `/${name}/${uuid.v4()}`) {
        this.app.get(url, (req, res) => {
            res.setHeader("Content-Type", "application/javascript")
                .status(200)
                .write(source);

            res.end();
        });

        return url;
    }

    addScriptFromFile(name: string, path: string | any, url: string = `/${name}/${uuid.v4()}`) {
        return this.addScript(name, fs.readFileSync(__dirname + "/" + path), url);
    }

    generateReactPage(scripts: string | string[]) {
            // ! Ignore: lol
            // eslint-disable-next-line no-param-reassign
            if(!Array.isArray(scripts)) scripts = [scripts];

            const src = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="icon" type="image/png" href="/favicon.png" sizes="32x32">
        <link rel="icon" type="image/png" href="/favicon.png" sizes="96x96">
        <title>Webbase v4</title>
        ${scripts.map(s => `<script src="${s}"></script>`)}
        <style>
            html, body, main {
                min-height: 100vh;
            }
        </style>
    </head>
    <body>
        <main id="react-container">
        </main>
    </body>
    </html>`;

            return src;
    }
}
