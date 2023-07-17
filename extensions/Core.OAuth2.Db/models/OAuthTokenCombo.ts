import * as uuid from "uuid";
import { Knex } from "knex";
import IOAuthTokenCombo from "./interfaces/IOAuthTokenCombo";
import OAuthUser from "./OAuthUser";
import IOAuthUser from "./interfaces/IOAuthUser";

export default class OAuthTokenCombo {
    static tableName: string = "template";
    static knex: Knex;

    static use(): Knex.QueryBuilder {
        return this.knex(this.tableName);
    }

    static async save(toSave: IOAuthTokenCombo): Promise<void> {
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

    static load(id: IOAuthTokenCombo["id"]): Promise<IOAuthTokenCombo> {
        return this.use().where("id", id).first();
    }

    static clearInvalid(): Promise<any> {
        return Promise.all([
            this.use()
                .whereNotNull("refreshTokenExpiresAt")
                .where("refreshtokenExpiresAt", "<", new Date())
                .delete(),
            this.use()
                .whereNull("refreshTokenExpiresAt")
                .whereNotNull("expiresAt")
                .where("expiresAt", "<", new Date())
                .delete(),
        ]);
    }

    static async tokenToUser(token: IOAuthTokenCombo["authToken"]): Promise<IOAuthUser> {
        const tokenCombo = await this.use()
            .where("authToken", token)
            .or.whereNull("expiresAt").where("expiresAt", ">", new Date())
            .first();
        if(!tokenCombo) return null;
        if(tokenCombo.expiresAt && tokenCombo.expiresAt < new Date()) return null;

        return OAuthUser.load(tokenCombo.userId);
    }

    static async createPairFromUserId(userId: IOAuthUser["id"], options?: {
        /** default: null */
        expiresAt?: Date;
        /** default: false */
        generateRefreshToken?: boolean;
        /** default: null */
        refreshTokenExpiresAt?: Date;
    }): Promise<IOAuthTokenCombo> {
        const tokenCombo: IOAuthTokenCombo = {
            id: uuid.v4(),
            authToken: uuid.v4(),
            refreshToken: options.generateRefreshToken ? uuid.v4() : null,
            userId,
            createdAt: new Date(),
            expiresAt: options?.expiresAt || null,
            refreshTokenExpiresAt: options.generateRefreshToken ? (options?.refreshTokenExpiresAt || null) : null,
        };

        await this.save(tokenCombo);
        return tokenCombo;
    }

    static async setup(knex: Knex): Promise<void> {
        this.knex = knex;
        const hasTable = await knex.schema.hasTable(this.tableName);

        if(hasTable) {
            return;
        }

        await this.knex.schema.createTable(this.tableName, table => {
            table.string("id", 36).notNullable().primary();

            table.string("authToken", 36).notNullable();
            table.string("refreshToken", 36).nullable();
            table.string("userId", 36).notNullable();

            table.datetime("expiresAt").nullable();
            table.datetime("refreshTokenExpiresAt").nullable();
            table.datetime("createdAt").notNullable();
            table.datetime("modifiedAt").nullable();
        });
    }
}
