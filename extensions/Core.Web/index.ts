import * as fs from "fs";
import * as crypto from "crypto";
import {EventEmitter} from "events";
import {Server} from "net";

import express from "express";
import expressWs from "express-ws";
import expressSession from "express-session";
import helmet from "helmet";
import * as uuid from "uuid";

import IExecutionContext from "@service/extensions/IExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import ConfigLoader from "@logic/config/ConfigLoader";

class CoreWebConfig {
    hostname: string = "127.0.0.1";
    port: number = 1325;
    secret: string = "SECRET";
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
    liveReload: {
        enabled: boolean,
        url: string,
        interval: NodeJS.Timer,
        waitMs: number,
        emitter: EventEmitter
    } = {
        enabled: false,
        url: "",
        interval: null,
        waitMs: 2000,
        emitter: new EventEmitter()
    };
    scripts: { [key: string]: {
        url: string,
        hash: string,
        content: Buffer
    } } = {};

    constructor() {
        this.config = this.loadConfig();
    }

    async start(executionContext: IExecutionContext) {
        if(executionContext.contextType === "cli") return;
        if(!this.config) {
            throw new Error(`Config not found at [${this.configLoader.configPath}]`);
        }

        this.app = express();
        expressWs(this.app);
        this.app.use(helmet({
            contentSecurityPolicy: false
        })).use(express.json({limit: "250mb"}))
            .use(express.urlencoded({extended: true}))
            .use(express.raw())
            .use(expressSession({
                secret: this.config.secret,
                saveUninitialized: true,
                resave: false,
                cookie: {
                    maxAge: 1000 * 60 * 60 // 60 Minutes
                }
            }));

        this.app.use((req, res, next) => {
            console.log("NOTE", "Core.Web", req.method, `${req.headers['x-forwarded-for'] || req.socket.remoteAddress} requested [${req.url}]`);
            next();
        });

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

    addScriptFromFile(name: string, path: string | any, options = {
        url: `/js/${name}/${uuid.v4()}`,
        readFileEveryRequest: true
    }) {
        const content = fs.readFileSync(__dirname + "/" + path);
        const scriptRegistryObject = this.scripts[path] = {
            url: options.url,
            content,
            hash: crypto.createHash("sha256").update(content).digest("hex")
        };

        if(!options.readFileEveryRequest) {
            return this.addScript(name, scriptRegistryObject.content, options.url);
        }
        else {
            this.app.get(options.url, (req, res) => {
                res.setHeader("Content-Type", "application/javascript")
                    .status(200)
                    .write(fs.readFileSync(__dirname + "/" + path));

                res.end();
            });

            return options.url;
        }
    }

    generateReactPage(scripts: string | string[]) {
        // ! Ignore: lol
        // eslint-disable-next-line no-param-reassign
        if(!Array.isArray(scripts)) scripts = [scripts];
        if(this.liveReload.enabled && this.liveReload.url) scripts.unshift(this.liveReload.url);

        const src = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="icon" type="image/png" href="/favicon.png" sizes="32x32">
        <link rel="icon" type="image/png" href="/favicon.png" sizes="96x96">
        <title>Webbase v4</title>
        ${scripts.map(s => `<script src="${s}"></script>`).join("\n")}
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

    enableLiveReload(waitMs: number = 0) {
        if(this.liveReload.enabled) return this;
        let oldHashes: {[key: string]: string} = {};

        this.liveReload.enabled = true;
        this.liveReload.url = this.addScriptFromFile("Core.Web.LiveReload", "Core.Web.LiveReload.js");
        this.liveReload.waitMs = waitMs || this.liveReload.waitMs;
        this.liveReload.interval = setInterval(async() => {
            let runtime = Date.now();
            const hasChange = (await Promise.all(fs.readdirSync("out").map((file) => {
                const newContent = fs.readFileSync("out/" + file);
                const newHash = crypto.createHash("sha256").update(newContent).digest("hex");
                const oldHash = oldHashes[file];

                if(newHash !== oldHash) {
                    oldHashes[file] = newHash;
                    return true;
                }

                return false;
            }))).some(Boolean);

            if(hasChange) {
                console.log("INFO", "Core.Web", `Firing Live-Reload event; Runtime = ${Date.now() - runtime}ms`);
                this.liveReload.emitter.emit("live-reload");
            }
        }, this.liveReload.waitMs);

        const expressWsApp = this.app as unknown as expressWs.Application;
        expressWsApp.ws("/Core.Web/LiveReload", (ws) => {
            let onReloadCallback = () => {
                ws.send(JSON.stringify({type: "REQUEST_REFRESH"}));
            };

            this.liveReload.emitter.on("live-reload", onReloadCallback);

            ws.on("error", () => {});
            ws.on("close", () => {
                this.liveReload.emitter.removeListener("live-reload", onReloadCallback);
            });
        });

        return this;
    }
}
