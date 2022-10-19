import {EventEmitter} from "events";

import IExecutionContext from "@service/extensions/IExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import ConfigLoader from "@logic/config/ConfigLoader";
import CoreDb from "../Core.Db";

import User from "../Core.Usermgmt/Models/User";
import ApiKey from "../Core.Usermgmt/Models/ApiKey";
import PermissionGroup from "../Core.Usermgmt/Models/PermissionGroup";
import Permission from "../Core.Usermgmt/Models/Permission";
import CoreWeb from "../Core.Web";
import CoreUsermgmt from "../Core.Usermgmt";

import Permissions from "./Core.Usermgmt.Web.Permissions";

declare module 'express-session' {
    export interface SessionData {
      uid: string
    }
  }

class TemplateConfig {

}

export default class CoreUsermgmtWeb implements IExtension {
    metadata: ExtensionMetadata = {
        name: "Core.Usermgmt.Web",
        version: "1.0.0",
        description: "Usermanagement Web Module",
        author: "ehdes",
        dependencies: ["Core.Usermgmt", "Core.Web"]
    };

    config: TemplateConfig;
    configLoader: ConfigLoader<typeof this.config>;
    events: EventEmitter = new EventEmitter();

    constructor() {
        this.config = this.loadConfig();
    }

    async start(executionContext: IExecutionContext) {
        this.checkConfig();
        if(executionContext.contextType === "cli") {
            return;
        }

        let coreUsermgmt = executionContext.extensionService.getExtension("Core.Usermgmt") as CoreUsermgmt;
        coreUsermgmt.createPermissions(...Object.values(Permissions));

        let coreDb = executionContext.extensionService.getExtension("Core.Db") as CoreDb;
        let coreWeb = executionContext.extensionService.getExtension("Core.Web") as CoreWeb;
        coreWeb.app.use(async(req, res, next) => {
            let useAnonGroup = false;
            if(req.session.uid) {
                useAnonGroup = true;
                let user = await User.use().where({id: req.session.uid}).first();
                if(!user) {
                    delete req.session.uid;
                }
                else {
                    let permGroup: Partial<PermissionGroup> = await PermissionGroup.use().where({id: user.permissionGroupId}).first();
                    if(permGroup) {
                        res.locals.additionalData = {
                            permissionGroup: permGroup.name,
                            permissions: await coreDb.db.columns("p.name", "p.description", "p.created", "p.modified")
                                .from(`${Permission.tableName} as p`)
                                .leftJoin("permissiongrouppermissions as pgp", "p.id", "pgp.permission")
                                .where({"pgp.permissiongroup": permGroup.id})
                        }
                        useAnonGroup = false;
                    }

                    res.locals.user = user;
                }
            }

            if(useAnonGroup) {
                let anonGroup = await PermissionGroup.use().where({name: "Anonymous"}).first();
                res.locals.additionalData = {
                    permissionGroup: anonGroup.name,
                    permissions: await coreDb.db.columns("p.name", "p.description", "p.created", "p.modified")
                        .from(`${Permission.tableName} as p`)
                        .leftJoin("permissiongrouppermissions as pgp", "p.id", "pgp.permission")
                        .where({"pgp.permissiongroup": anonGroup.id})
                }
            }
            next();
        });

        coreWeb.app.get("/core.usermgmt/logon-info", async(req, res) => {
            if(!res.locals.user) {
                res.json({loggedIn: false});
                return;
            }

            res.json({loggedIn: true, uid: res.locals.user.id, user: res.locals.user, additionalData: res.locals.additionalData});
        });
        
        coreWeb.app.post("/core.usermgmt/user/:id/impersonate", async(req, res) => {
            let permissions: Permission[] = res.locals.additionalData.permissions;
            if(permissions.some(p => p.name === Permissions.ImpersonateUser.name))

            req.session.uid = req.params.id;
        });
    }

    async stop() {

    }

    private checkConfig() {
        if(!this.config) {
            throw new Error(`Config could not be found at [${this.configLoader.configPath}]`);
        }
    }

    private loadConfig() {
        let model = new TemplateConfig();
        if(Object.keys(model).length === 0) return model;

        let [cfgname, templatename] = this.generateConfigNames();
        this.configLoader = new ConfigLoader(cfgname, templatename);
        let cfg = this.configLoader.createTemplateAndImport(model);

        return cfg;
    }

    private generateConfigNames() {
        return [
            ConfigLoader.createConfigPath(`${this.metadata.name}.json`),
            ConfigLoader.createConfigPath(`${this.metadata.name}.template.json`)
        ];
    }
}
