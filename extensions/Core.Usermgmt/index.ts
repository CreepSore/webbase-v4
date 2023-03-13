import {EventEmitter} from "events";

import IExecutionContext from "@service/extensions/IExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import ConfigLoader from "@logic/config/ConfigLoader";
import CoreDb from "@extensions/Core.Db";
import { Knex } from "knex";

import User from "@extensions/Core.Usermgmt/Models/User";
import ApiKey from "@extensions/Core.Usermgmt/Models/ApiKey";
import PermissionGroup from "@extensions/Core.Usermgmt/Models/PermissionGroup";
import Permission from "@extensions/Core.Usermgmt/Models/Permission";

class TemplateConfig {

}

export default class CoreUsermgmt implements IExtension {
    metadata: ExtensionMetadata = {
        name: "Core.Usermgmt",
        version: "1.0.0",
        description: "Usermanagement Module",
        author: "ehdes",
        dependencies: ["Core.Db"],
    };

    config: TemplateConfig;
    configLoader: ConfigLoader<typeof this.config>;
    events: EventEmitter = new EventEmitter();

    constructor() {
        this.config = this.loadConfig();
    }

    async start(executionContext: IExecutionContext): Promise<void> {
        this.checkConfig();
        if(executionContext.contextType === "cli") {
            return;
        }

        const coreDb = executionContext.extensionService.getExtension("Core.Db") as CoreDb;
        await this.setupSchema(coreDb.db);
    }

    async stop(): Promise<void> {

    }

    async loginByCredentials(credentials: {email?: string, username?: string, password: string}): Promise<{user?: Partial<User>, error?: string}> {
        if(credentials.email && credentials.username) return null;
        const where: Partial<User> = {password: User.hashPassword(credentials.password)};
        if(credentials.email) {
            where.email = credentials.email;
        }
        else if(credentials.username) {
            where.username = credentials.username;
        }
        else {
            return {
                error: "INVALID_CREDENTIALS",
            };
        }

        const user = await User.use().where(where).first();
        if(!user) {
            return {
                error: "INVALID_CREDENTIALS",
            };
        }
        else if(!user.isActive) {
            return {
                error: "USER_INACTIVE",
            };
        }

        return {
            user,
        };
    }

    async loginByApiKey(apiKey: string): Promise<{user?: Partial<User>, error?: string}> {
        const foundApiKey = (await ApiKey.use().where({id: apiKey}).first()) as Partial<ApiKey>;
        if(!foundApiKey) return null;

        const user = await User.use().where({id: foundApiKey.id}).first() as Partial<User>;
        if(!user) {
            return {
                error: "INVALID_API_KEY",
            };
        }

        if(!user.isActive) {
            return {
                error: "USER_INACTIVE",
            };
        }

        return {
            user,
            error: null,
        };
    }

    async createPermissions(...permissions: Partial<Permission>[]): Promise<Partial<Permission>[]> {
        return await Promise.all(permissions.map(async p => {
            const foundPerm = await Permission.use().where({name: p.name}).first();
            if(foundPerm) {
                return foundPerm;
            }

            p.created = new Date();
            await Permission.use().insert(p);
            return await Permission.use().where({name: p.name}).first();
        }));
    }

    private async setupSchema(knex: Knex): Promise<void> {
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

        if(!await PermissionGroup.exists({name: "Anonymous"})) {
            await PermissionGroup.create({
                name: "Anonymous",
                description: "Default Group",
            });
        }

        if(!await PermissionGroup.exists({name: "Administrator"})) {
            await PermissionGroup.create({
                name: "Administrator",
                description: "Administrator Group",
            });
        }
    }

    private checkConfig(): void {
        if(!this.config) {
            throw new Error(`Config could not be found at [${this.configLoader.configPath}]`);
        }
    }

    private loadConfig(): typeof this.config {
        const model = new TemplateConfig();
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
