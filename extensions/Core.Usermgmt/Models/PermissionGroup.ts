import { Knex } from "knex";
import Permission from "./Permission";

export default class PermissionGroup {
    static tableName: string = "permissiongroups";
    static knex: Knex;
    id?: number;
    name: string;
    description?: string;
    created?: Date;
    modified?: Date;


    static async resolve(group: Partial<PermissionGroup>){
        return await this.use().where(group).select() as Partial<PermissionGroup>[];
    }

    static use(){
        return this.knex(this.tableName);
    }

    static async removePermission(group: Partial<PermissionGroup>, permission: Partial<Permission>){
        const resolvedPermissionGroup = await this.resolve(group);
        const resolvedPermissions = await Permission.resolve(permission);

        if(resolvedPermissionGroup.length !== 1) return null;
        if(resolvedPermissions.length === 0) return null;

        return await this.knex("permissiongrouppermissions").delete().where({
            permissiongroup: resolvedPermissionGroup[0].id,
        }).whereIn("permission", resolvedPermissions.map(p => p.id));
    }

    static async addPermission(group: Partial<PermissionGroup>, permission: Partial<Permission>){
        const resolvedPermissionGroup = await this.resolve(group);
        const resolvedPermission = await Permission.resolve(permission);

        if(resolvedPermissionGroup.length !== 1) return null;
        if(resolvedPermission.length !== 1) return null;

        try {
            return await this.knex("permissiongrouppermissions").insert({
                permission: resolvedPermission[0].id,
                permissiongroup: resolvedPermissionGroup[0].id,
                created: new Date(),
            });
        }
        catch {
            return 0;
        }
    }

    static async hasPermission(group: Partial<PermissionGroup>, permission: Partial<Permission>){
        const resolvedPermissionGroup = await this.resolve(group);
        const resolvedPermission = await Permission.resolve(permission);

        if(resolvedPermissionGroup.length !== 1) return false;
        if(resolvedPermission.length !== 1) return false;

        return (await this.knex("permissiongrouppermissions").where({
            permission: resolvedPermission[0].id,
            permissiongroup: resolvedPermissionGroup[0].id,
        }).select()).length > 0;
    }

    static async create(data: PermissionGroup){
        data.created = data.created || new Date();
        return await this.use().insert(data);
    }

    static async exists(data: Partial<PermissionGroup>){
        return (await this.use().where(data).select()).length > 0;
    }

    static async setup(knex: Knex){
        this.knex = knex;
        await knex.schema.hasTable(this.tableName)
            .then(val => !val && knex.schema.createTable(this.tableName, table => {
                table.increments("id")
                    .primary();

                table.string("name")
                    .unique();

                table.text("description");

                table.dateTime("created");
                table.dateTime("modified").nullable();
            }));
    }
}
