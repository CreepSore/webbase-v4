import {EventEmitter} from "events";

import IExecutionContext from "@service/extensions/IExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import ConfigLoader from "@logic/config/ConfigLoader";
import CoreDb from "../Core.Db";
import { Knex } from "knex";

import User from "../Core.Usermgmt/Models/User";
import ApiKey from "../Core.Usermgmt/Models/ApiKey";
import PermissionGroup from "../Core.Usermgmt/Models/PermissionGroup";
import Permission from "../Core.Usermgmt/Models/Permission";
import CoreWeb from "../Core.Web";

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
        await this.setupSchema(coreDb.db);
    }

    async stop() {

    }

    async loginByCredentials(credentials: {email?: string, username?: string, password: string}) {
        if(credentials.email && credentials.username) return null;
        let where: Partial<User> = {password: User.hashPassword(credentials.password), isActive: true};
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

        let user = await User.use().where({id: foundApiKey.id, isActive: true}).first() as Partial<User>;
        if(!user) return null;

        return user;
    }

    async createPermissions(...permissions: Partial<Permission>[]): Promise<Partial<Permission>[]> {
        return await Promise.all(permissions.map(async p => {
            let foundPerm = await Permission.use().where({name: p.name}).first();
            if(foundPerm) {
                return foundPerm;
            }

            p.created = new Date();
            await Permission.use().insert(p);
            return await Permission.use().where({name: p.name}).first();
        }));
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

        const [allPerm] = await this.createPermissions({
            name: "ALL",
            description: "Pseudopermission for all permissions"
        });

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

            PermissionGroup.addPermission({name: "Administrator"}, {name: "ALL"});
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
