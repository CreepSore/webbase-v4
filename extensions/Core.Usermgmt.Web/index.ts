import * as dns from "dns/promises";
import {EventEmitter} from "events";

import IExecutionContext, { IAppExecutionContext, IChildExecutionContext as IChildAppExecutionContext, ICliExecutionContext } from "@service/extensions/IExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import ConfigLoader from "@logic/config/ConfigLoader";
import Core from "@extensions/Core";
import CoreWeb from "@extensions/Core.Web";
import CoreUsermgmt from "@extensions/Core.Usermgmt";
import createAuthenticationRouter from "./routers/AuthenticationRouter";
import Urls from "./urls";
import createPermissionRouter from "./routers/PermissionRouter";
import createUserRouter from "./routers/UserRouter";
import AuthorizationHandler from "@extensions/Core.Usermgmt/handlers/AuthorizationHandler";
import LogBuilder from "@service/logger/LogBuilder";
import User from "@extensions/Core.Usermgmt/models/User";

declare module "express-session" {
    interface SessionData {
        userId: string;
    }
}

// ! Disabling these rules since they're fucked up
declare global {
    // eslint-disable-next-line no-unused-vars
    namespace Express {
        // eslint-disable-next-line no-unused-vars
        interface Request {
            additionalData: {authorizationHandler: AuthorizationHandler}
        }

        interface Response {
            additionalData: {authorizationHandler: AuthorizationHandler}
        }
    }
}

class CoreUsermgmtWebConfig {
    autologin = {
        enabled: false,
        entries: [
            {ip: "127.0.0.1", username: "Root"},
            {dns: "localhost", username: "Root"},
        ],
    };
}

export default class CoreUsermgmtWeb implements IExtension {
    static metadata: ExtensionMetadata = {
        name: "Core.Usermgmt.Web",
        version: "2.0.0",
        description: "Usermanagement API Module",
        author: "ehdes",
        dependencies: [Core, CoreWeb, CoreUsermgmt],
    };

    metadata: ExtensionMetadata = CoreUsermgmtWeb.metadata;
    autologinEntries: {ip: string, username: string}[] = [];

    config: CoreUsermgmtWebConfig = new CoreUsermgmtWebConfig();
    events: EventEmitter = new EventEmitter();
    $: <T extends IExtension>(name: string|Function & { prototype: T }) => T;

    constructor() {
        this.config = this.loadConfig(true);
    }

    async start(executionContext: IExecutionContext): Promise<void> {
        this.checkConfig();
        this.$ = <T extends IExtension>(name: string|Function & { prototype: T }) => executionContext.extensionService.getExtension(name) as T;
        if(executionContext.contextType === "cli") {
            await this.startCli(executionContext);
            return;
        }
        else if(executionContext.contextType === "app") {
            await this.startMain(executionContext);
            return;
        }
        else if(executionContext.contextType === "child-app") {
            await this.startChildApp(executionContext);
            return;
        }
    }

    async stop(): Promise<void> {

    }

    private async startCli(executionContext: ICliExecutionContext): Promise<void> {

    }

    private async startMain(executionContext: IAppExecutionContext): Promise<void> {
        if(this.config.autologin.enabled) {
            this.autologinEntries = (await Promise.all(this.config.autologin.entries.map(async al => {
                if(al.dns) {
                    try {
                        al.ip = (await dns.resolve4(al.dns))[0];
                    }
                    catch { return null; }
                }

                if(!al.ip) return null;

                return {
                    ip: al.ip,
                    username: al.username,
                };
            }))).filter(Boolean);
        }

        const coreWeb = this.$(CoreWeb);

        coreWeb.app.use(async(req, res, next) => {
            try {
                if(!req.session.userId) {
                    const autologin = this.autologinEntries.find(
                        login => (req.headers["x-forwarded-for"] && login.ip === req.headers["x-forwarded-for"])
                            || (!req.headers["x-forwarded-for"] && login.ip === req.socket.remoteAddress),
                    )?.username;

                    if(autologin) {
                        LogBuilder
                            .start()
                            .level("WARN")
                            .info("Core.Usermgmt.Web")
                            .line("Automatic logon occured")
                            .object("info", {
                                ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
                                uid: autologin,
                            }).done();

                        const user = await User.findOne({username: autologin});

                        if(user) {
                            req.session.userId = user._id.toString();
                        }
                    }
                }
            }
            catch(ex) {
                LogBuilder
                    .start()
                    .level("ERROR")
                    .info("Core.Usermgmt.Web")
                    .line("Autologin failed.")
                    .object("error", ex)
                    .done();
            }

            try {
                const authorizationHandler = await AuthorizationHandler.fromRequest(req);
                if(authorizationHandler.isApiKeyLogon) {
                    req.session.userId = authorizationHandler.user._id.toString();
                }

                req.additionalData = {authorizationHandler};
                res.additionalData = {authorizationHandler};

                next();
            }
            catch(ex) {
                LogBuilder
                    .start()
                    .level("ERROR")
                    .info("Core.Usermgmt.Web")
                    .line("Failed to initialize authorization handler")
                    .object("error", ex)
                    .done();
            }
        });

        coreWeb.addAppRoute("/core.usermgmt.web/login", coreWeb.addScriptFromFile("Core.Usermgmt.Web.Main", "Core.Usermgmt.Web/web/main.js"));
        coreWeb.app.use(
            Urls.base,
            (req, res, next) => {
                res.set("Cache-Control", "no-store");
                next();
            },
            createAuthenticationRouter(),
            createPermissionRouter(),
            createUserRouter(),
        );
    }

    private async startChildApp(executionContext: IChildAppExecutionContext): Promise<void> {

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
            new CoreUsermgmtWebConfig(),
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
