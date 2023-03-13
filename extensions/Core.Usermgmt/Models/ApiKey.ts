import * as crypto from "crypto";
import { Knex } from "knex";

export default class ApiKey {
    static tableName: string = "apikeys";
    static knex: Knex;
    id?: string;
    validUntil?: Date;
    user: string;
    created?: Date;
    modified?: Date;

    constructor(apiKey: Partial<ApiKey>){
        Object.assign(this, apiKey);
    }

    static use(){
        return this.knex(this.tableName);
    }

    static async setup(knex: Knex){
        this.knex = knex;
        await knex.schema.hasTable(this.tableName)
            .then(async val => {
                if(val) return;

                await knex.schema.createTable(this.tableName, table => {
                    table.string("id", 36)
                        .primary();

                    table.boolean("isActive");

                    table.dateTime("validUntil")
                        .nullable();

                    table.string("userId")
                        .references("id")
                        .inTable("users");

                    table.dateTime("created");
                    table.dateTime("modified").nullable();
                });
            });
    }

    static hashPassword(password: string){
        return crypto.createHash("sha256").update(password).digest("base64");
    }
}
