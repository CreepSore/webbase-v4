import { Knex } from "knex";

export default class ApiKey {
    static tableName: string = "apikeys";
    static knex: Knex;
    id?: string;
    validUntil?: Date;
    userId: string;
    created?: Date;
    modified?: Date;

    constructor(apiKey: Partial<ApiKey>) {
        Object.assign(this, apiKey);
    }

    // ! We don't care about this
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    static use() {
        return this.knex(this.tableName);
    }

    static async setup(knex: Knex): Promise<void> {
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

                    table.dateTime("createdAt");
                    table.dateTime("modifiedAt").nullable();
                });
            });
    }

    static isValid(apiKey: ApiKey): boolean {
        if(!apiKey) return false;
        if(!apiKey.validUntil) return true;
        return apiKey.validUntil > new Date();
    }
}
