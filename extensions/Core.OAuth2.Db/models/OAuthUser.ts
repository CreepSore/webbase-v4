import * as crypto from "crypto";

import * as uuid from "uuid";
import { Knex } from "knex";
import IOAuthUser, { IOAuthUserAuthenticationParameter } from "./interfaces/IOAuthUser";
import AuthenticationParameter from "@extensions/Core.OAuth2/enums/AuthenticationParameter";

export default class OAuthUser {
    static tableName: string = "oauthuser";
    static authenticationTypesTableName: string = "oauthuser_authparameters";
    static knex: Knex;

    static use(): Knex.QueryBuilder {
        return this.knex(this.tableName);
    }

    static async save(toSave: IOAuthUser): Promise<void> {
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

    static load(id: IOAuthUser["id"]): Promise<IOAuthUser> {
        return this.use().where("id", id).first();
    }

    static loadByUsername(username: IOAuthUser["name"]): Promise<IOAuthUser> {
        return this.use().where("name", username).first();
    }

    static loadByEmail(email: IOAuthUser["email"]): Promise<IOAuthUser> {
        return this.use().where("email", email).first();
    }

    static async loadByApiKey(apiKey: string): Promise<IOAuthUser> {
        const {userId} = (
            await this.knex(this.authenticationTypesTableName)
                .where("type", AuthenticationParameter.ApiKey)
                .where("value", apiKey)
                .first()
        );

        if(!userId) {
            return null;
        }

        return await this.load(userId);
    }

    static isAuthParamEnabled(id: IOAuthUser["id"], type: AuthenticationParameter): Promise<boolean> {
        return this.knex(this.authenticationTypesTableName)
            .where("userId", id)
            .where("type", type)
            .first()
            .then(Boolean);
    }

    static async getAuthParamValue(id: IOAuthUser["id"], type: AuthenticationParameter): Promise<string> {
        const row = await this.knex(this.authenticationTypesTableName)
            .where("userId", id)
            .where("type", type)
            .first();

        return row.value || null;
    }

    static async setAuthParamValue(id: IOAuthUser["id"], type: AuthenticationParameter, value: string): Promise<void> {
        const exists = await this.knex(this.authenticationTypesTableName)
            .where("userId", id)
            .where("type", type)
            .first();

        if(exists) {
            await this.knex(this.authenticationTypesTableName)
                .where("userId", id)
                .where("type", type)
                .update({ value });
        }
        else {
            await this.knex(this.authenticationTypesTableName)
                .insert({ userId: id, type, value, createdAt: new Date() });
        }
    }

    static async unsetAuthParamValue(id: IOAuthUser["id"], type: AuthenticationParameter): Promise<void> {
        await this.knex(this.authenticationTypesTableName)
            .where("userId", id)
            .where("type", type)
            .delete();
    }

    static async getAuthParameters(id: IOAuthUser["id"]): Promise<IOAuthUserAuthenticationParameter[]> {
        return this.knex(this.authenticationTypesTableName)
            .where("userId", id);
    }

    static hashPassword(password: string): string {
        return password
            ? crypto.createHash("sha256").update(password).digest("hex")
            : null;
    }

    static async setup(knex: Knex): Promise<void> {
        this.knex = knex;
        const hasUserTable = await knex.schema.hasTable(this.tableName);
        const hasAuthenticationParametersTable = await knex.schema.hasTable(this.authenticationTypesTableName);

        if(!hasUserTable) {
            await this.knex.schema.createTable(this.tableName, table => {
                table.string("id", 36).notNullable().primary();

                table.string("name", 50).notNullable().unique();
                table.string("email", 255).notNullable().unique();

                table.datetime("createdAt").notNullable();
                table.datetime("modifiedAt").nullable();
            });
        }

        if(!hasAuthenticationParametersTable) {
            await this.knex.schema.createTable(this.authenticationTypesTableName, table => {
                table.string("userId", 36)
                    .notNullable()
                    .references("id")
                    .inTable(this.tableName)
                    .onDelete("CASCADE");

                table.string("type", 50).notNullable();
                table.string("value", 255).nullable();

                table.datetime("createdAt").notNullable();
                table.datetime("modifiedAt").nullable();

                table.primary(["userId", "type"]);
            });
        }
    }
}
