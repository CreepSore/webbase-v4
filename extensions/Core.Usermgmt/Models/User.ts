import * as crypto from "crypto";
import { Knex } from "knex";
import * as uuid from "uuid";
import Permission from "./Permission";
import PermissionGroup from "./PermissionGroup";

export default class User {
    static tableName: string = "users";
    static knex: Knex;
    id?: string;
    username: string;
    email?: string;
    password: string;
    isActive: boolean;
    permissionGroupId?: number;
    created?: Date;
    modified?: Date;

    static async resolve(user: Partial<User>) {
        return await this.use().where(user).select() as Partial<User>[];
    }

    static async setPermissionGroup(user: Partial<User>, permissionGroup: Partial<PermissionGroup>) {
        let resolvedUser = await this.resolve(user);
        let resolvedPermissionGroup = await PermissionGroup.resolve(permissionGroup);

        if(resolvedUser.length !== 1) return false;
        if(resolvedPermissionGroup.length !== 1) return false;

        await this.use().update({permissionGroupId: resolvedPermissionGroup[0].id, modified: new Date()});

        return true;
    }

    static async hasPermission(user: Partial<User>, permission: Partial<Permission>) {
        let resolvedUser = await this.resolve(user);
        let resolvedPermission = await Permission.use().where(permission).select() as Partial<Permission>[];

        if(resolvedUser.length !== 1) return false;
        if(resolvedPermission.length !== 1) return false;

        return await PermissionGroup.hasPermission({id: resolvedUser[0].permissionGroupId}, {id: resolvedPermission[0].id});
    }

    static async hasPermissions(user: Partial<User>, ...permissions: Array<Partial<Permission>>) {
        return (await Promise.all(permissions.map(p => this.hasPermission(user, p)))).every(b => Boolean(b));
    }

    static use() {
        return this.knex(this.tableName);
    }

    static async exists(data: Partial<User>) {
        return (await this.use().where(data).select()).length > 0;
    }

    static construct(data: Partial<User> | Partial<User>[]) {
        let result: Partial<User>[] = data as Partial<User[]>;
        if(!Array.isArray(data)) {
            result = [data];
        }

        result = (result as Partial<User>[]).map(data => {
            let user = new User();
            user.id = data.id;
            user.username = data.username;
            user.password = data.password;
            // @ts-ignore
            user.isActive = data.isActive === 1;
            user.email = data.email;
            user.created = data.created ? new Date(data.created) : null;
            user.modified = data.modified ? new Date(data.modified) : null;
            return user;
        });

        return Array.isArray(data) ? result : result[0];
    }

    static async create(user: User) {
        user.id = user.id || uuid.v4();
        user.created = user.created || new Date();
        user.permissionGroupId = user.permissionGroupId || (await PermissionGroup.use().where({name: "Anonymous"}))[0].id;
        user.email = user.email || null;

        return await this.knex.insert(user).into(this.tableName);
    }

    static async setup(knex: Knex) {
        this.knex = knex;
        await knex.schema.hasTable(this.tableName)
            .then(val => !val && knex.schema.createTable(this.tableName, table => {
                table.string("id", 36)
                    .primary()
                    .notNullable();

                table.string("username", 32)
                    .unique();

                table.string("email", 255)
                    .nullable();

                table.string("password", 44); // SHA256

                table.boolean("isActive");

                table.integer("permissionGroupId")
                    .nullable()
                    .references("id")
                    .inTable("permissiongroups");

                table.dateTime("created");
                table.dateTime("modified").nullable();
            }));
    }

    static hashPassword(password: string) {
        return crypto.createHash("sha256").update(password).digest("hex");
    }
}
