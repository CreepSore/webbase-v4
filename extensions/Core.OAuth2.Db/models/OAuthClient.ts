import * as uuid from "uuid";
import { Knex } from "knex";
import IOAuthClient from "./interfaces/IOAuthClient";

export default class OAuthClient {
    static tableName: string = "oauthclient";
    static urlTableName: string = "oauthclient_redirecturl";
    static knex: Knex;

    static use(): Knex.QueryBuilder {
        return this.knex(this.tableName);
    }

    static async save(toSave: IOAuthClient): Promise<void> {
        if(toSave.id) {
            const exists = await this.use().where("id", toSave.id).first();
            if(exists) {
                toSave.modifiedAt = new Date();
                await this.use().where("id", toSave.id).update(toSave);
                return;
            }
        }
        else {
            toSave.id = uuid.v4();
        }

        toSave.createdAt = new Date();
        await this.use().insert(toSave);
    }

    static load(id: IOAuthClient["id"]): Promise<IOAuthClient> {
        return this.use().where("id", id).first();
    }

    static getRedirectUrls(id: IOAuthClient["id"]): Promise<string[]> {
        return this.knex(this.urlTableName).where("clientId", id).select("url");
    }

    static addRedirectUrl(id: IOAuthClient["id"], url: string): Promise<void> {
        return this.knex(this.urlTableName).insert({ clientId: id, url });
    }

    static removeRedirectUrl(id: IOAuthClient["id"], url: string): Promise<void> {
        return this.knex(this.urlTableName).where({ clientId: id, url }).delete();
    }

    static async isValidRedirectUrl(id: IOAuthClient["id"], url: string): Promise<boolean> {
        return Boolean(await this.knex(this.urlTableName).where({ clientId: id, url }).first());
    }

    static async setup(knex: Knex): Promise<void> {
        this.knex = knex;
        const hasOauthTable = await knex.schema.hasTable(this.tableName);
        const hasUrlTable = await knex.schema.hasTable(this.urlTableName);

        if(!hasOauthTable) {
            await this.knex.schema.createTable(this.tableName, table => {
                table.string("id", 36).notNullable().primary();

                table.string("name", 50).notNullable().unique();
                table.string("secret", 36).notNullable().unique();

                table.datetime("createdAt").notNullable();
                table.datetime("modifiedAt").nullable();
            });
        }

        if(!hasUrlTable) {
            await this.knex.schema.createTable(this.urlTableName, table => {
                table.string("clientId", 36)
                    .notNullable()
                    .references("id")
                    .inTable(this.tableName)
                    .onDelete("CASCADE");
                table.string("url", 200).notNullable();

                table.primary(["clientId", "url"]);
            });
        }
    }
}
