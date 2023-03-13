/* eslint-disable @typescript-eslint/explicit-function-return-type */
// ! No, thank you very much
import { Knex } from "knex";

export default class Permission {
    static tableName: string = "permissions";
    static knex: Knex;
    id?: number;
    name: string;
    description?: string;
    created?: Date;
    modified?: Date;

    static async resolve(permission: Partial<Permission>)  {
        return await this.use().where(permission).select() as Partial<Permission>[];
    }

    static use() {
        return this.knex(this.tableName);
    }

    static async create(data: Permission) {
        data.created = data.created || new Date();
        return await this.use().insert(data);
    }

    static async exists(data: Partial<Permission>) {
        return (await this.use().where(data).select()).length > 0;
    }

    static async setup(knex: Knex) {
        this.knex = knex;
        await knex.schema.hasTable(this.tableName)
            .then(val => !val && knex.schema.createTable(this.tableName, table => {
                table.increments("id")
                    .primary();

                table.string("name", 64)
                    .unique();

                table.text("description");

                table.dateTime("created");
                table.dateTime("modified").nullable();
            }));
    }
}
