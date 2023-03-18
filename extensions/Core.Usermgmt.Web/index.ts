import * as dns from "dns/promises";
import {EventEmitter} from "events";

import * as express from "express";

import IExecutionContext from "@service/extensions/IExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import ConfigLoader from "@logic/config/ConfigLoader";
import CoreDb from "@extensions/Core.Db";

import User from "@extensions/Core.Usermgmt/Models/User";
import ApiKey from "@extensions/Core.Usermgmt/Models/ApiKey";
import PermissionGroup from "@extensions/Core.Usermgmt/Models/PermissionGroup";
import Permission from "@extensions/Core.Usermgmt/Models/Permission";
import CoreWeb from "@extensions/Core.Web";
import CoreUsermgmt from "@extensions/Core.Usermgmt";

import Permissions from "./permissions";
import { Knex } from "knex";
import expressWs from "express-ws";
import LogBuilder from "@service/logger/LogBuilder";

declare module "express-session" {
    export interface SessionData {
      uid: string
    }
}

// ! Disabling these rules since they're fucked up
declare global {
    // eslint-disable-next-line no-unused-vars
    namespace Express {
        // eslint-disable-next-line no-unused-vars
        interface Request {
            user: User;
            additionalData: {permissionGroup: string, permissions: Permission[]}
        }
    }
}

class CoreUsermgmtWebConfig {
    autologin = [
        {ip: "127.0.0.1", userid: "2"},
        {dns: "localhost", userid: "2"},
    ];
}

export default class CoreUsermgmtWeb implements IExtension {
    metadata: ExtensionMetadata = {
        name: "Core.Usermgmt.Web",
        version: "1.0.0",
        description: "Usermanagement Web Module",
        author: "ehdes",
        dependencies: ["Core.Usermgmt", "Core.Web"],
    };

    config: CoreUsermgmtWebConfig;
    configLoader: ConfigLoader<typeof this.config>;
    events: EventEmitter = new EventEmitter();

    knex: Knex;

    constructor() {
        this.config = this.loadConfig();
    }

    async start(executionContext: IExecutionContext): Promise<void> {
        this.checkConfig();
        if(executionContext.contextType === "cli") {
            return;
        }

        this.config.autologin = (await Promise.all(this.config.autologin.map(async al => {
            if(al.dns) {
                try {
                    al.ip = (await dns.resolve4(al.dns))[0];
                }
                catch {return null;}
            }

            if(!al.ip) return null;
            return {
                ip: al.ip,
                userid: al.userid,
            };
        }))).filter(Boolean);

        const coreUsermgmt = executionContext.extensionService.getExtension("Core.Usermgmt") as CoreUsermgmt;
        const perms = await coreUsermgmt.createPermissions(...Object.values(Permissions));
        await Promise.all(perms.map(p => PermissionGroup.addPermission({name: "Administrator"}, p)));

        const coreDb = executionContext.extensionService.getExtension("Core.Db") as CoreDb;
        this.knex = coreDb.db;

        const coreWeb = executionContext.extensionService.getExtension("Core.Web") as CoreWeb;
        // ! We literally can't do shit about that
        // eslint-disable-next-line new-cap
        const apiRouter = express.Router();

        coreWeb.app.use(async(req, res, next) => {
            if(req.query.apiKey) {
                next();
                return;
            }

            const autologin = this.config.autologin.find(login => login.ip === req.headers["x-forwarded-for"] || login.ip === req.socket.remoteAddress)?.userid;
            if(autologin && !req.session.uid) {
                LogBuilder
                    .start()
                    .level("WARN")
                    .info("Core.Usermgmt.Web")
                    .line("Automatic logon occured")
                    .object("info", {
                        ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
                        uid: autologin,
                    }).done();
                req.session.uid = autologin;
            }

            await this.handleUidLogon(req, res, req.session.uid);

            next();
        }, async(req, res, next) => {
            const {apiKey} = req.query;
            if(!apiKey) {
                next();
                return;
            }

            const apiKeyObject: ApiKey = await ApiKey.use().where({
                id: apiKey,
            }).first();

            if(!apiKeyObject) {
                LogBuilder
                    .start()
                    .level("WARN")
                    .info("Core.Usermgmt.Web")
                    .line("Failed API Key logon: Invalid API Key")
                    .object("info", {
                        ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
                        apiKey,
                    }).done();

                next();
                return;
            }

            if(!ApiKey.isValid(apiKeyObject)) {
                LogBuilder
                    .start()
                    .level("WARN")
                    .info("Core.Usermgmt.Web")
                    .line("Failed API Key logon: API Key expired")
                    .object("info", {
                        ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
                        apiKey,
                    }).done();

                next();
                return;
            }

            const user: User = await User.use().where({id: apiKeyObject.userId}).first();
            if(!user) {
                LogBuilder
                    .start()
                    .level("WARN")
                    .info("Core.Usermgmt.Web")
                    .line("Failed API Key logon: Invalid User on API Key")
                    .object("info", {
                        ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
                        apiKey,
                    }).done();

                next();
                return;
            }

            await this.handleUidLogon(req, res, user.id);

            LogBuilder
                .start()
                .level("WARN")
                .info("Core.Usermgmt.Web")
                .line("API Key Logon occured")
                .object("info", {
                    ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
                    apiKey,
                    uid: user.id,
                }).done();

            next();
        });

        apiRouter.get("/logon-info", async(req, res) => {
            if(!res.locals.user) {
                res.json({loggedIn: false, additionalData: res.locals.additionalData});
                return;
            }

            res.json({loggedIn: true, uid: res.locals.user.id, user: res.locals.user, additionalData: res.locals.additionalData});
        });

        apiRouter.post("/user/:id/impersonate", this.checkPermissions(Permissions.ImpersonateUser.name), async(req, res) => {
            LogBuilder
                .start()
                .level("WARN")
                .info("Core.Usermgmt.Web")
                .line("Impersonation occured")
                .object("info", {
                    ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
                    uid: req.params.id,
                }).done();
            req.session.uid = req.params.id;
            res.json({success: true});
        });

        apiRouter.get("/user", this.checkPermissions(Permissions.ViewUser.name), async(req, res) => {
            res.json(await User.use().select());
        });

        apiRouter.get("/user/:id", this.checkPermissions(Permissions.ViewUser.name), async(req, res) => {
            res.json(await User.use().where({id: req.params.id}).first());
        });

        apiRouter.put("/user", this.checkPermissions(Permissions.CreateUser.name), async(req, res) => {
            const data = req.body;
            data.password = User.hashPassword(data.password);
            data.isActive = Boolean(data.isActive);

            try {
                await User.create(data);
                res.json({success: true});
            }
            catch {
                res.json({success: false});
            }
        });

        apiRouter.patch("/user/:id", this.checkPermissions(Permissions.EditUser.name), async(req, res) => {
            const user = await User.use().where({id: req.params.id}).first();
            if(!user) {
                res.json({success: false});
                return;
            }

            const data = req.body;
            if(data.password !== user.password) {
                data.password = User.hashPassword(data.password);
            }
            data.isActive = Boolean(data.isActive);

            await User.use().where({id: req.params.id}).update(req.body);
            res.json({success: true});
        });

        apiRouter.delete("/user/:id", this.checkPermissions(Permissions.DeleteUser.name), async(req, res) => {
            await User.use().where({id: req.params.id}).delete();
            res.json({success: true});
        });

        apiRouter.post("/login", async(req, res) => {
            const logon = await coreUsermgmt.loginByCredentials(req.body);
            if(logon.error) {
                LogBuilder
                    .start()
                    .level("WARN")
                    .info("Core.Usermgmt.Web")
                    .line("Impersonation occured")
                    .object("info", {
                        ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
                    }).debugObject("credentials", req.body).done();
                return res.json({success: false, error: logon.error});
            }

            LogBuilder
                .start()
                .level("INFO")
                .info("Core.Usermgmt.Web")
                .line("Impersonation occured")
                .object("info", {
                    ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
                }).debugObject("credentials", req.body).done();

            req.session.uid = logon.user.id;
            return res.json({success: true});
        });

        apiRouter.post("/logout", async(req, res) => {
            delete req.session.uid;
            res.json({success: true});
        });

        apiRouter.get("/permission", this.checkPermissions(Permissions.ViewPermissions.name), async(req, res) => {
            res.json(await Permission.use().select());
        });

        apiRouter.get("/permission-group", this.checkPermissions(Permissions.ViewPermissions.name), async(req, res) => {
            const permissionGroups = await PermissionGroup.use().select();
            await Promise.all(permissionGroups.map(async pg => {
                const permissions = await Permission.use()
                    .select("permissions.id", "permissions.name", "permissions.description")
                    .join("permissiongrouppermissions as pgp", "permissions.id", "permission")
                    .join(`${PermissionGroup.tableName} as pg`, "permissiongroup", "pg.id")
                    .where("pg.id", pg.id);

                pg.permissions = permissions;
            }));

            res.json(permissionGroups);
        });

        apiRouter.put("/permission-group/:pgid/permission/:pid", this.checkPermissions(Permissions.EditPermissions.name), async(req, res) => {
            const {pgid, pid} = req.params;
            console.log("INFO", "Core.Dashboard", `Adding Permission [${pid}] to Group [${pgid}]`);

            await coreDb.db("permissiongrouppermissions").insert({
                permission: pid,
                permissiongroup: pgid,
                created: Date.now(),
            }).then(() => res.json({success: true}))
                .catch(() => res.json({success: false}));
        });

        apiRouter.delete("/permission-group/:pgid/permission/:pid", this.checkPermissions(Permissions.EditPermissions.name), async(req, res) => {
            const {pgid, pid} = req.params;
            console.log("INFO", "Core.Dashboard", `Deleting Permission [${pid}] from Group [${pgid}]`);

            await coreDb.db("permissiongrouppermissions").where({
                permissiongroup: pgid,
                permission: pid,
            }).delete();
            res.json({success: true});
        });

        coreWeb.app.use("/api/core.usermgmt", apiRouter);
    }

    async stop(): Promise<void> {

    }

    checkPermissions(...perms: string[]) {
        return (req: express.Request, res: express.Response, next: express.NextFunction) => {
            const {permissions} = res.locals.additionalData;
            if(!permissions.some((p: Permission) => perms.includes(p.name))) return res.status(403).end();

            return next();
        };
    }

    checkPermissionsWs(...perms: string[]): expressWs.WebsocketRequestHandler {
        return async(ws, req, next) => {
            const res = await User.hasPermissions({id: req.session.uid}, ...perms.map(p => {
                return {
                    name: p,
                };
            }));

            if(!res) return ws.close();
            return next();
        };
    }

    hasPermission(res: express.Response, ...perms: string[]): boolean {
        const {permissions} = res.locals.additionalData;
        return permissions.some((p: Permission) => perms.includes(p.name));
    }

    private async constructAdditionalDataObject(permGroup: PermissionGroup): Promise<{
        permissionGroup: string;
        permissions: Permission[];
    }> {
        return {
            permissionGroup: permGroup.name,
            permissions: await this.knex.columns("p.name", "p.description", "p.created", "p.modified")
                .from(`${Permission.tableName} as p`)
                .leftJoin("permissiongrouppermissions as pgp", "p.id", "pgp.permission")
                .where({"pgp.permissiongroup": permGroup.id}) as any,
        };
    }

    private async handleUidLogon(
        req: express.Request,
        res: express.Response,
        uid: string = null,
    ): Promise<void> {
        req.session.uid = uid;

        let useAnonGroup = true;
        if(req.session.uid) {
            const user = await User.use().where({id: req.session.uid}).first();
            if(!user) {
                delete req.session.uid;
            }
            else {
                const permGroup: PermissionGroup = await PermissionGroup.use().where({id: user.permissionGroupId}).first();
                if(permGroup) {
                    req.additionalData = res.locals.additionalData = await this.constructAdditionalDataObject(permGroup);
                    useAnonGroup = false;
                }

                req.user = res.locals.user = user;
            }
        }

        if(useAnonGroup) {
            const anonGroup = await PermissionGroup.use().where({name: "Anonymous"}).first();
            req.additionalData = res.locals.additionalData = await this.constructAdditionalDataObject(anonGroup);
        }
    }

    private checkConfig(): void {
        if(!this.config) {
            throw new Error(`Config could not be found at [${this.configLoader.configPath}]`);
        }
    }

    private loadConfig(): typeof this.config {
        const model = new CoreUsermgmtWebConfig();
        if(Object.keys(model).length === 0) return model;

        const [cfgname, templatename] = this.generateConfigNames();
        this.configLoader = new ConfigLoader(cfgname, templatename);
        const cfg = this.configLoader.createTemplateAndImport(model);

        return cfg;
    }

    private generateConfigNames(): string[] {
        return [
            ConfigLoader.createConfigPath(`${this.metadata.name}.json`),
            ConfigLoader.createConfigPath(`${this.metadata.name}.template.json`),
        ];
    }
}
