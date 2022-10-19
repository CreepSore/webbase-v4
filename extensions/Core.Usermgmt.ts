import {EventEmitter} from "events";

import IExecutionContext from "@service/extensions/IExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import ConfigLoader from "@logic/config/ConfigLoader";
import CoreDb from "./Core.Db";
import { Knex } from "knex";

import User from "./Core.Usermgmt/Models/User";
import ApiKey from "./Core.Usermgmt/Models/ApiKey";
import PermissionGroup from "./Core.Usermgmt/Models/PermissionGroup";
import Permission from "./Core.Usermgmt/Models/Permission";
import CoreWeb from "./Core.Web";

declare module 'express-session' {
    export interface SessionData {
      uid: string
    }
  }

class TemplateConfig {

}

export default class CoreUsermgmt implements IExtension {
    metadata: ExtensionMetadata = {
        name: "Core.Usermgmt",
        version: "1.0.0",
        description: "Usermanagement Module",
        author: "ehdes",
        dependencies: ["Core.Db"]
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

        let coreDb = executionContext.extensionService.getExtension("Core.Db") as CoreDb;
        coreDb.onDbLoaded((knex) => {
            this.setupSchema(knex);
            this.events.emit("initialized");
        });

        let coreWeb = executionContext.extensionService.getExtension("Core.Web") as CoreWeb;
        coreWeb.app.get("/core.usermgmt/userdata", async(req, res) => {
            if(!req.session.uid) {
                return res.json({loggedIn: false, uid: null});
            }
            let user = await User.use().where({id: req.session.uid}).first();
            delete user.password;
            if(!user) {
                req.session.uid = null;
                return res.json({loggedIn: false, uid: null});
            }

            res.json({loggedIn: true, uid: req.session.uid, user});
        });
    }

    async stop() {

    }

    onInitialized(callback: () => void) {
        this.events.on("initialized", callback);
    }

    async loginByCredentials(credentials: {email?: string, username?: string, password: string}) {
        if(credentials.email && credentials.username) return null;
        let where: typeof credentials = {password: User.hashPassword(credentials.password)};
        if(credentials.email) {
            where.email = credentials.email;
        }
        else if(credentials.username) {
            where.username = credentials.username;
        }
        else {
            return null;
        }

        return Boolean(await User.use().where(where).first());
    }

    async loginByApiKey(apiKey: string) {
        let foundApiKey = (await ApiKey.use().where({id: apiKey}).first()) as Partial<ApiKey>;
        if(!foundApiKey) return null;

        let user = await User.use().where({id: foundApiKey.id}).first() as Partial<User>;
        if(!user) return null;

        return user;
    }

    private async setupSchema(knex: Knex) {
        await Permission.setup(knex);
        await PermissionGroup.setup(knex);

        await knex.schema.hasTable("permissiongrouppermissions")
            .then(val => !val && knex.schema.createTable("permissiongrouppermissions", table => {
                table.integer("permission")
                    .references("id")
                    .inTable("permissions");

                table.integer("permissiongroup")
                    .references("id")
                    .inTable("permissiongroups");

                table.unique(["permission", "permissiongroup"]);

                table.dateTime("created");
            }));

        await User.setup(knex);
        await ApiKey.setup(knex);

        let permissionsToCreate: {check: Boolean, data: Permission}[] = [
            {check: await Permission.exists({name: "ALL"}), data: {
                name: "ALL",
                description: "Pseudopermission for all permissions"
            }}
        ]

        await Promise.all(permissionsToCreate.filter(p => !p.check).map(async(p) => {
            await Permission.create(p.data);
        }));

        if(!await PermissionGroup.exists({name: "Anonymous"})) {
            await PermissionGroup.create({
                name: "Anonymous",
                description: "Default Group"
            });
        }

        if(!await PermissionGroup.exists({name: "Administrator"})) {
            await PermissionGroup.create({
                name: "Administrator",
                description: "Administrator Group"
            });

            let group = await PermissionGroup.use().where({name: "Administrator"}).first();
            await knex("permissiongrouppermissions").insert({
                permission: (await Permission.use().where({name: "ALL"}).first()).id,
                permissiongroup: group.id,
                created: Date.now()
            });
        }
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
