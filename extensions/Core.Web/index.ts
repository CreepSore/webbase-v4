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
import LogBuilder from "@service/logger/LogBuilder";
import Core from "@extensions/Core";

// ! Disabling these rules since they're fucked up
declare module "express-session" {
    export interface SessionData {
        acceptedCookies?: string[]
    }
}

class CoreWebConfig {
    hostname: string = "127.0.0.1";
    port: number = 1325;
    secret: string = "SECRET";
    saveSessionOnInit: boolean = false;
    // ! These are more or less pseudovalues
    // ! Since we should always proxy through nginx, these
    // ! should be set according to it's settings.
    httpHost: string = "localhost";
    httpProtocol: string = "https";
}

export default class CoreWeb implements IExtension {
    static metadata: ExtensionMetadata = {
        name: "Core.Web",
        version: "1.0.0",
        description: "Core Web Module",
        author: "ehdes",
        dependencies: [Core],
    };

    metadata: ExtensionMetadata = CoreWeb.metadata;

    config: CoreWebConfig;
    app: express.Express;
    // ! I still can't do shit about this
    // eslint-disable-next-line new-cap
    coreRouter: express.Router = express.Router();
    server: Server;
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
            emitter: new EventEmitter(),
        };
    scripts: { [key: string]: {
        url: string,
        hash: string,
        content: Buffer
    } } = {};
    logSkipping: RegExp[] = [];

    constructor() {
        this.config = this.loadConfig(true);
    }

    async start(executionContext: IExecutionContext): Promise<void> {
        if(executionContext.contextType === "cli") return;
        this.checkConfig();

        this.app = express();
        expressWs(this.app);

        this.app.use(helmet({
            contentSecurityPolicy: false,
        })).use(express.json({limit: "250mb"}))
            .use(express.urlencoded({extended: true}))
            .use(express.raw())
            .use(expressSession({
                secret: this.config.secret,
                saveUninitialized: this.config.saveSessionOnInit === true,
                resave: false,
                cookie: {
                    maxAge: 1000 * 60 * 60, // 60 Minutes
                },
            }));

        this.app.use((req, res, next) => {
            if(this.config.saveSessionOnInit) {
                req.session.acceptedCookies = ["mandatory"];
            }

            if(this.logSkipping.some(regex => regex.test(req.url))) {
                return next();
            }

            LogBuilder
                .start()
                .level("NOTE")
                .info("Core.Web")
                .info(req.method)
                .line(`${req.headers["x-forwarded-for"] || req.socket.remoteAddress} requested [${req.url}]`)
                .debugObject("body", Object.values(req.body).length > 0 ? req.body : null)
                .done();

            return next();
        });

        this.app.use(this.coreRouter);

        this.app.post("/api/core.web/acceptCookies", (req, res) => {
            req.session.acceptedCookies = req.body.cookies;
            res.json({success: true});
        });

        this.app.post("/api/core.web/declineCookies", (req, res) => {
            res.json({success: true});
        });

        this.events.emit("express-loaded", this.app);
        this.server = this.app.listen(this.config.port, this.config.hostname);

        LogBuilder
            .start()
            .level("INFO")
            .info("Core.Web")
            .line("Started Web-Server")
            .object("config", this.config)
            .done();
    }

    async stop(): Promise<void> {
        this.server.removeAllListeners();
        this.server.close();
    }

    onExpressLoaded(callback: (app: express.Express) => void): void {
        this.events.on("express-loaded", callback);
    }

    addAppRoute(routeUrl: string, scriptUrl: string): void {
        this.app.get(routeUrl, (req, res) => {
            res.send(this.generateReactPage(scriptUrl)).end();
        });
    }

    addScript(name: string, source: string | any, url: string = `/${name}/${uuid.v4()}`): string {
        this.app.get(url, (req, res) => {
            res.setHeader("Cache-Control", "public, max-age=86400, must-revalidate");

            res.setHeader("Content-Type", "application/javascript")
                .status(200)
                .write(source);

            res.end();
        });

        return url;
    }

    addScriptFromFile(name: string, path: string | any, options: {
        url?: string,
        readFileEveryRequest?: boolean
    } = {}): string {
        const url = options.url || `/js/${name}/${uuid.v4()}`;
        const readFileEveryRequest = options.readFileEveryRequest || process.env.DEBUG === "true";

        const content = fs.readFileSync(__dirname + "/" + path);
        const scriptRegistryObject = this.scripts[path] = {
            url,
            content,
            hash: crypto.createHash("sha256").update(content).digest("hex"),
        };

        if(!readFileEveryRequest) {
            return this.addScript(name, scriptRegistryObject.content, url);
        }

        this.app.get(url, (req, res) => {
            res.setHeader("Content-Type", "application/javascript")
                .status(200)
                .write(fs.readFileSync(__dirname + "/" + path));

            res.end();
        });

        return url;
    }

    generateReactPage(scripts: string | string[] = []): string {
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

    enableLiveReload(waitMs: number = 0, productive: boolean = false): CoreWeb {
        const {env} = process;

        if(!productive && env.DEBUG !== "true") return this;
        if(this.liveReload.enabled) return this;
        const oldHashes: {[key: string]: string} = {};

        this.liveReload.enabled = true;
        this.liveReload.url = this.addScriptFromFile("Core.Web.LiveReload", "Core.Web.LiveReload.js");
        this.liveReload.waitMs = waitMs || this.liveReload.waitMs;
        this.liveReload.interval = setInterval(async() => {
            const runtime = Date.now();
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
            const onReloadCallback = (): void => {
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

    skipLogForUrl(url: RegExp | string): CoreWeb {
        this.logSkipping.push(typeof url === "string" ? new RegExp(url) : url);
        return this;
    }

    private checkConfig(): void {
        if(!this.config) {
            throw new Error(`Config could not be found at [${this.generateConfigNames()[0]}]`);
        }
    }

    private loadConfig(createDefault: boolean = false): typeof this.config {
        const [configPath, templatePath] = this.generateConfigNames();
        return ConfigLoader.initConfigWithModel(
            configPath,
            templatePath,
            new CoreWebConfig(),
            createDefault,
        );
    }

    private generateConfigNames(): string[] {
        return [
            ConfigLoader.createConfigPath(`${this.metadata.name}.json`),
            ConfigLoader.createTemplateConfigPath(`${this.metadata.name}.json`),
        ];
    }
}
