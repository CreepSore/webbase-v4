import {EventEmitter} from "events";

import IExecutionContext from "@service/extensions/IExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import ConfigLoader from "@logic/config/ConfigLoader";
import CoreWeb from "./Core.Web";
import User from "./Core.Usermgmt/Models/User";
import PermissionGroup from "./Core.Usermgmt/Models/PermissionGroup";
import Permission from "./Core.Usermgmt/Models/Permission";
import CoreDb from "./Core.Db";

class TemplateConfig {

}

export default class CoreDashboard implements IExtension {
    metadata: ExtensionMetadata = {
        name: "Core.Dashboard",
        version: "1.0.0",
        description: "Dashboard Module",
        author: "ehdes",
        dependencies: ["Core.Web", "Core.Usermgmt"]
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

        let coreWeb = executionContext.extensionService.getExtension("Core.Web") as CoreWeb;
        let coreDb = executionContext.extensionService.getExtension("Core.Db") as CoreDb;
        let mainScriptUrl = coreWeb.addScriptFromFile("Core.Dashboard.Main", "Core.Dashboard.Main.js");
        coreWeb.addAppRoute("/core.dashboard/", mainScriptUrl);

        coreWeb.app.get("/core.dashboard/user", async(req, res) => {
            res.json(await User.use().select());
        }).post("/core.dashboard/user", async(req, res) => {
            res.json(await User.use().select().where(req.body));
        }).patch("/core.dashboard/user", async(req, res) => {
            let userdata: Partial<User> = req.body;
            if(!userdata.id) return res.json({success: false}).end();
            let user = await User.use().where({id: userdata.id}).first();
            if(!user) return res.json({success: false}).end();
            console.log("INFO", "Core.Dashboard", `Updating User [${userdata.id}]:[${JSON.stringify(userdata)}]`);

            if(user.password !== userdata.password) {
                userdata.password = User.hashPassword(userdata.password);
            }

            let toSet = {...userdata};
            toSet.modified = new Date();
            delete toSet.id;

            res.json({success: true, result: await User.use().update(toSet).where({id: userdata.id})}).end();
        }).put("/core.dashboard/user", async(req, res) => {
            let userdata: User = req.body;
            if(userdata.id) return res.json({success: false}).end();
            userdata.password = User.hashPassword(userdata.password);
            console.log("INFO", "Core.Dashboard", `Adding User [${JSON.stringify(userdata)}]`);

            res.json({success: true, result: await User.create(userdata)});
        }).delete("/core.dashboard/user/:id", async(req, res) => {
            console.log("INFO", "Core.Dashboard", `Deleting User [${req.params.id}]`);
            res.json({success: true, result: await User.use().where({id: req.params.id}).delete()})
        });

        coreWeb.app.get("/core.dashboard/permission", async(req, res) => {
            res.json(await Permission.use().select());
        });

        coreWeb.app.get("/core.dashboard/permission-group/", async(req, res) => {
            const permissionGroups = await PermissionGroup.use().select();
            await Promise.all(permissionGroups.map(async pg => {
                let permissions = await Permission.use()
                    .select("permissions.id", "permissions.name", "permissions.description")
                        .join("permissiongrouppermissions as pgp", "permissions.id", "permission")
                        .join(`${PermissionGroup.tableName} as pg`, "permissiongroup", "pg.id")
                        .where("pg.id", pg.id);

                pg.permissions = permissions;
            }));

            res.json(permissionGroups);
        }).put("/core.dashboard/permission-group/:pgid/permission/:pid", async(req, res) => {
            const {pgid, pid} = req.params;
            console.log("INFO", "Core.Dashboard", `Adding Permission [${pid}] to Group [${pgid}]`);

            await coreDb.db("permissiongrouppermissions").insert({
                permission: pid,
                permissiongroup: pgid,
                created: Date.now()
            }).then(() => res.json({success: true}))
            .catch(() => res.json({success: false}));
        }).delete("/core.dashboard/permission-group/:pgid/permission/:pid", async(req, res) => {
            const {pgid, pid} = req.params;
            console.log("INFO", "Core.Dashboard", `Deleting Permission [${pid}] from Group [${pgid}]`);

            await coreDb.db("permissiongrouppermissions").where({
                permissiongroup: pgid,
                permission: pid
            }).delete();
            res.json({success: true});
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
};

