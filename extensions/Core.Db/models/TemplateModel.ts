import * as uuid from "uuid";
import { Knex } from "knex";
import ITemplateInterface from "./interfaces/ITemplateInterface";

export default class Template {
    static tableName: string = "template";
    static knex: Knex;

    static use(): Knex.QueryBuilder {
        return this.knex(this.tableName);
    }

    static async save(toSave: ITemplateInterface): Promise<void> {
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

    static load(id: ITemplateInterface["id"]): Promise<ITemplateInterface> {
        return this.use().where("id", id).first();
    }

    static async setup(knex: Knex): Promise<void> {
        this.knex = knex;
        const hasTable = await knex.schema.hasTable(this.tableName);

        if(hasTable) {
            return;
        }

        await this.knex.schema.createTable(this.tableName, table => {
            table.string("id", 36).notNullable().primary();
            table.datetime("createdAt").notNullable();
            table.datetime("modifiedAt").nullable();
        });
    }
}
