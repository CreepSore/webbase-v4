import {EventEmitter} from "events";

import IExecutionContext, { IAppExecutionContext, ICliExecutionContext } from "@service/extensions/IExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import ConfigLoader from "@logic/config/ConfigLoader";
import Core from "@extensions/Core";
import CoreWeb from "@extensions/Core.Web";
import OAuthErrorFactory from "@extensions/Core.OAuth2/errors";
import IOAuthUser from "@extensions/Core.OAuth2.Db/models/interfaces/IOAuthUser";
import CoreUsermgmt from "@extensions/Core.Usermgmt";
import User from "@extensions/Core.Usermgmt/Models/User";

declare module "express-session" {
    export interface SessionData {
      token: {
        authToken: string,
        refreshToken: string,
        expiresAt: number,
      }
    }
}

class CoreOAuth2ClientConfig {
    enabled: boolean = false;
    oauthHost: string = "localhost";
    clientId: string = "";
    clientSecret: string = "";
}

export default class CoreOAuth2Client implements IExtension {
    static metadata: ExtensionMetadata = {
        name: "Core.OAuth2.Client",
        version: "1.0.0",
        description: "Template Module",
        author: "ehdes",
        dependencies: [Core, CoreWeb, CoreUsermgmt],
    };

    metadata: ExtensionMetadata = CoreOAuth2Client.metadata;

    config: CoreOAuth2ClientConfig = new CoreOAuth2ClientConfig();
    events: EventEmitter = new EventEmitter();
    $: <T extends IExtension>(name: string|Function & { prototype: T }) => T;
    stateRedirects: Map<string, string> = new Map();

    constructor() {
        this.config = this.loadConfig();
    }

    async start(executionContext: IExecutionContext): Promise<void> {
        if(!this.checkConfig()) {
            return;
        }

        this.$ = <T extends IExtension>(name: string|Function & { prototype: T }) => executionContext.extensionService.getExtension(name) as T;
        if(executionContext.contextType === "cli") {
            await this.startCli(executionContext);
            return;
        }
        else if(executionContext.contextType === "app") {
            await this.startMain(executionContext);
            return;
        }
    }

    async stop(): Promise<void> {

    }

    private async startCli(executionContext: ICliExecutionContext): Promise<void> {

    }

    private async startMain(executionContext: IAppExecutionContext): Promise<void> {
        const coreWeb = this.$(CoreWeb);
        coreWeb.coreRouter.use((req, res, next) => {
            const validRedirectUris = [...this.stateRedirects.values()].map(uri => new URL(uri).pathname);
            if(req.url === "/" || validRedirectUris.includes(req.url)) {
                res.setHeader("Access-Control-Allow-Origin", `https://${this.config.oauthHost}`);
                res.setHeader("Access-Control-Allow-Headers", "Content-Type");
                res.setHeader("Access-Control-Allow-Credentials", "true");
                if(req.method === "OPTIONS") {
                    res.end();
                    return;
                }
            }
            next();
        });

        coreWeb.coreRouter.options("/oauth2/callback", async(req, res) => {
            res.setHeader("Access-Control-Allow-Origin", `https://${this.config.oauthHost}`);
            res.setHeader("Access-Control-Allow-Headers", "Content-Type");
            res.setHeader("Access-Control-Allow-Credentials", "true");
            res.end();
        });

        coreWeb.coreRouter.get("/oauth2/callback", async(req, res) => {
            res.setHeader("Access-Control-Allow-Origin", `https://${this.config.oauthHost}`);
            res.setHeader("Access-Control-Allow-Headers", "Content-Type");
            res.setHeader("Access-Control-Allow-Credentials", "true");

            const {code, state} = req.query;
            if(!code) {
                res.status(400).send(OAuthErrorFactory.invalidCode().message);
                return;
            }

            const tokenUrl = new URL(`https://${this.config.oauthHost}/oauth2/token`);
            tokenUrl.searchParams.set("code", code as string);
            try {
                const tokenFetchData = await fetch(tokenUrl.href);
                if(tokenFetchData.status === 400) {
                    const error = await tokenFetchData.json();
                    res.status(400).send(error.error);
                    return;
                }

                const token: {authToken: string, refreshToken: string, expiresAt: number} = await tokenFetchData.json();
                req.session.token = token;

                const userinfoFetchData = await fetch(`https://${this.config.oauthHost}/oauth2/userinfo`, {
                    headers: {
                        Authorization: `Bearer ${token.authToken}`,
                    },
                });

                if(userinfoFetchData.status === 400) {
                    const error = await tokenFetchData.json();
                    res.status(400).send(error.error);
                    return;
                }

                const userinfo = await userinfoFetchData.json() as Partial<Pick<IOAuthUser, "id"|"name"|"email">>;
                if(!userinfo.id) {
                    res.status(400).send(OAuthErrorFactory.invalidToken().message);
                    return;
                }

                if(!await User.exists({id: userinfo.id})) {
                    await User.create({
                        id: userinfo.id,
                        username: userinfo.name,
                        email: userinfo.email,
                        created: null,
                        isActive: false,
                        password: null,
                    });
                }

                req.session.uid = userinfo.id;
                req.session.save();

                const redirectTo = this.stateRedirects.get(state as string);
                if(redirectTo) {
                    res.redirect(redirectTo);
                }
                else {
                    res.redirect(`${coreWeb.config.httpProtocol}://${coreWeb.config.httpHost}/`);
                }
            }
            catch(error) {
                res.status(400).send(error.error);
                return;
            }
        });
    }

    generateLoginUrl(redirectUrl: string, state: string, clientId: string = this.config.clientId, clientSecret: string = this.config.clientSecret): string {
        const url = new URL(`https://${this.config.oauthHost}/oauth2`);
        url.searchParams.set("redirectUri", redirectUrl);
        url.searchParams.set("clientSecret", clientSecret);
        url.searchParams.set("clientId", clientId);
        url.searchParams.set("state", state);
        return url.href;
    }

    registerStateRedirect(state: string, redirectUrl: string): void {
        this.stateRedirects.set(state, redirectUrl);
    }

    private checkConfig(): boolean {
        return Boolean(this.config) && this.config.enabled;
    }

    private loadConfig(createDefault: boolean = false): typeof this.config {
        const [configPath, templatePath] = this.generateConfigNames();
        return ConfigLoader.initConfigWithModel(
            configPath,
            templatePath,
            new CoreOAuth2ClientConfig(),
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
