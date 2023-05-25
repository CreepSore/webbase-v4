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

class LoginError extends Error { }

class CoreUsermgmtConfig {

}

export default class CoreUsermgmt implements IExtension {
    metadata: ExtensionMetadata = {
        name: "Core.Usermgmt",
        version: "1.0.0",
        description: "Usermanagement Module",
        author: "ehdes",
        dependencies: ["Core.Db"],
    };

    config: CoreUsermgmtConfig;
    events: EventEmitter = new EventEmitter();

    constructor() {
        this.config = this.loadConfig(true);
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

    async loginByCredentials(credentials: {email?: string, username?: string, password: string}): Promise<User> {
        if(credentials.email && credentials.username) return null;
        const where: Partial<User> = {password: User.hashPassword(credentials.password)};
        if(credentials.email) {
            where.email = credentials.email;
        }
        else if(credentials.username) {
            where.username = credentials.username;
        }
        else {
            throw new LoginError("INVALID_CREDENTIALS");
        }

        const user = await User.use().where(where).first();
        if(!user) {
            throw new LoginError("INVALID_CREDENTIALS");
        }
        else if(!user.isActive) {
            throw new LoginError("USER_INACTIVE");
        }

        return user;
    }

    async loginByApiKey(apiKey: string): Promise<User> {
        const foundApiKey = (await ApiKey.use().where({id: apiKey}).first()) as Partial<ApiKey>;
        if(!foundApiKey) throw new LoginError("INVALID_API_KEY");

        const user = await User.use().where({id: foundApiKey.userId}).first() as Partial<User>;
        if(!user) {
            throw new LoginError("INVALID_API_KEY");
        }

        if(!user.isActive) {
            throw new LoginError("USER_INACTIVE");
        }

        return user as User;
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
            throw new Error(`Config could not be found at [${this.generateConfigNames()[0]}]`);
        }
    }

    private loadConfig(createDefault: boolean = false): typeof this.config {
        const [configPath, templatePath] = this.generateConfigNames();
        return ConfigLoader.initConfigWithModel(
            configPath,
            templatePath,
            new CoreUsermgmtConfig(),
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
