import {EventEmitter} from "events";

import * as uuid from "uuid";
import * as nodeCron from "node-cron";

import IExecutionContext, { IAppExecutionContext, ICliExecutionContext } from "@service/extensions/IExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import ConfigLoader from "@logic/config/ConfigLoader";
import Core from "@extensions/Core";
import CoreWeb from "@extensions/Core.Web";
import OAuthAuthenticationHandler from "@extensions/Core.OAuth2/logic/OAuthAuthenticationHandler";
import IAuthenticationRequest from "./interfaces/requests/IAuthenticationRequest";
import OAuthClient from "@extensions/Core.OAuth2.Db/models/OAuthClient";
import OAuthErrorFactory, { OAuthError } from "@extensions/Core.OAuth2/errors";
import OAuthTokenCombo from "@extensions/Core.OAuth2.Db/models/OAuthTokenCombo";
import IOAuthUser from "@extensions/Core.OAuth2.Db/models/interfaces/IOAuthUser";
import AuthenticationData from "@extensions/Core.OAuth2/interfaces/AuthenticationData";

class CoreOAuth2WebConfig {

}

export default class CoreOAuth2Web implements IExtension {
    static metadata: ExtensionMetadata = {
        name: "Core.OAuth2.Web",
        version: "1.0.0",
        description: "OAuth2 Web Module",
        author: "ehdes",
        dependencies: [Core, CoreWeb],
    };

    metadata: ExtensionMetadata = CoreOAuth2Web.metadata;

    config: CoreOAuth2WebConfig = new CoreOAuth2WebConfig();
    events: EventEmitter = new EventEmitter();
    $: <T extends IExtension>(name: string|Function & { prototype: T }) => T;
    codeMapping: Map<string, {userId: IOAuthUser["id"], expiresAt: number}> = new Map();
    codeWatchdog: nodeCron.ScheduledTask;

    constructor() {
        this.config = this.loadConfig();
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
    }

    async stop(): Promise<void> {

    }

    private async startCli(executionContext: ICliExecutionContext): Promise<void> {

    }

    private async startMain(executionContext: IAppExecutionContext): Promise<void> {
        const coreWeb = this.$(CoreWeb);

        this.codeWatchdog = nodeCron.schedule("* * * * * *", async() => {

        });

        coreWeb.app.get<any, any, any, any, {code: string}>("/oauth2/token", async(req, res, next) => {
            const {code} = req.query;
            const codeMapping = this.codeMapping.get(code);
            if(!code || !codeMapping || codeMapping.expiresAt < Date.now()) {
                res.status(400).json({error: OAuthErrorFactory.invalidCode().message});
                return;
            }

            this.codeMapping.delete(code);

            const tokenCombo = await OAuthTokenCombo.createPairFromUserId(codeMapping.userId, {
                expiresAt: new Date(Date.now() + 1000 * 60 * 10),
            });

            res.status(200).json({
                authToken: tokenCombo.authToken,
                refreshToken: tokenCombo.refreshToken,
                expiresAt: new Date(tokenCombo.expiresAt).getTime(),
            });
        });

        coreWeb.app.get<any, any, any, any, {code: string}>("/oauth2/userinfo", async(req, res, next) => {
            const {authorization} = req.headers;
            if(!authorization) {
                res.status(400).json({error: OAuthErrorFactory.invalidToken().message});
                return;
            }

            // Example: "Bearer <token>"
            const token = authorization.split(" ")[1];
            const user = await OAuthTokenCombo.tokenToUser(token);

            if(!user) {
                res.status(400).json({error: OAuthErrorFactory.invalidToken().message});
                return;
            }

            res.status(200).json({
                id: user.id,
                name: user.name,
                email: user.email,
            } as IOAuthUser);
        });

        coreWeb.app.use(/\/oauth2$/, async(req, res, next) => {
            const authenticationRequest = req.query as unknown as IAuthenticationRequest & {scopes: string};
            const parsedAuthenticationRequest = {
                ...authenticationRequest,
                scopes: (authenticationRequest.scopes || "").split(" "),
            };

            try {
                if(!parsedAuthenticationRequest.clientId) {
                    throw OAuthErrorFactory.invalidClient();
                }

                if(!parsedAuthenticationRequest.clientId) {
                    throw OAuthErrorFactory.invalidClientSecret();
                }

                if(!parsedAuthenticationRequest.redirectUri) {
                    throw OAuthErrorFactory.invalidRedirectUri();
                }

                const client = await OAuthClient.load(parsedAuthenticationRequest.clientId);
                if(!client) {
                    throw OAuthErrorFactory.invalidClient();
                }
                else if(client.secret !== parsedAuthenticationRequest.clientSecret) {
                    throw OAuthErrorFactory.invalidClientSecret();
                }
                else if(!await OAuthClient.isValidRedirectUrl(client.id, parsedAuthenticationRequest.redirectUri)) {
                    throw OAuthErrorFactory.invalidRedirectUri();
                }
            }
            catch(error) {
                res.status(400).json(error.message);
                return;
            }

            next();
        }, async(req, res, next) => {
            if(req.method !== "GET") return next();

            res.status(200).json({success: true});
        }, async(req, res, next) => {
            if(req.method !== "POST") return next();

            const authenticationRequest = req.query as unknown as IAuthenticationRequest & {scopes: string};
            const parsedAuthenticationRequest = {
                ...authenticationRequest,
                scopes: (authenticationRequest.scopes || "").split(" "),
            };

            const {authData} = req.body as {authData: AuthenticationData};
            try {
                const user = await OAuthAuthenticationHandler.doLogin(authData);
                if(user) {
                    const code = uuid.v4();
                    this.codeMapping.set(code, {
                        userId: user.id,
                        expiresAt: Date.now() + 1000 * 60 * 10,
                    });

                    const url = new URL(parsedAuthenticationRequest.redirectUri);
                    url.searchParams.set("code", code);
                    if(authenticationRequest.state) {
                        url.searchParams.set("state", authenticationRequest.state);
                    }
                    res.redirect(url.href);
                }
                else {
                    const url = new URL(parsedAuthenticationRequest.redirectUri);
                    url.searchParams.set("error", OAuthErrorFactory.invalidToken().message);
                    res.redirect(url.href);
                }
            }
            catch(error) {
                const url = new URL(parsedAuthenticationRequest.redirectUri);
                url.searchParams.set("error", error.message);
                res.redirect(url.href);
                return;
            }
        });
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
            new CoreOAuth2WebConfig(),
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
