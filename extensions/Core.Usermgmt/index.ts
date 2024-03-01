import {EventEmitter} from "events";

import * as uuid from "uuid";

import IExecutionContext from "@service/extensions/IExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import ConfigLoader from "@logic/config/ConfigLoader";
import CoreDb from "@extensions/Core.Db";
import mongoose from "mongoose";
import User from "./models/User";
import PermissionGroup from "./models/PermissionGroup";
import Permissions from "./permissions";
import AuthenticationHandler from "./handlers/AuthenticationHandler";
import AuthorizationHandler from "./handlers/AuthorizationHandler";
import LogBuilder from "@service/logger/LogBuilder";

class CoreUsermgmtConfig {

}

export default class CoreUsermgmt implements IExtension {
    static metadata: ExtensionMetadata = {
        name: "Core.Usermgmt",
        version: "2.0.0",
        description: "Usermanagement Module",
        author: "ehdes",
        dependencies: [CoreDb],
    };

    metadata: ExtensionMetadata = CoreUsermgmt.metadata;

    config: CoreUsermgmtConfig;
    events: EventEmitter = new EventEmitter();
    db: typeof mongoose;
    $: <T extends IExtension>(name: string|Function & { prototype: T }) => T;

    constructor() {
        this.config = this.loadConfig(true);
    }

    async start(executionContext: IExecutionContext): Promise<void> {
        this.checkConfig();
        this.$ = <T extends IExtension>(name: string|Function & { prototype: T }) => executionContext.extensionService.getExtension(name) as T;
        if(executionContext.contextType !== "app") {
            return;
        }

        const coreDb = this.$(CoreDb);
        this.db = coreDb.db;

        await this.setupSchema();
    }

    async stop(): Promise<void> {

    }

    private async initializeDefaultEntries(): Promise<void> {
        let administratorGroup = await PermissionGroup.findOne({name: "Administrator"});
        let anonymousGroup = await PermissionGroup.findOne({name: "Anonymous"});

        if(!administratorGroup) {
            const newGroup = new PermissionGroup({
                name: "Administrator",
                description: "Administrator group",
                permissions: [],
            });

            administratorGroup = await newGroup.save();
        }

        if(!anonymousGroup) {
            const newGroup = new PermissionGroup({
                name: "Anonymous",
                description: "Anonymous group",
                permissions: [],
            });

            anonymousGroup = await newGroup.save();
        }

        await AuthorizationHandler.createPermissionLayer(Permissions);

        if(!(await AuthenticationHandler.getRootUser())) {
            const onceKey = uuid.v4();

            LogBuilder
                .start()
                .level("WARN")
                .info("Core.Usermgmt")
                .line(`Root user created. One-Time-Key: [${onceKey}]`)
                .done();

            await new User({
                username: "Root",
                email: "root@localhost",
                groups: [administratorGroup._id],
                apiKeys: [],
                authentication: [{
                    type: "once_key",
                    keys: [onceKey],
                }],
            }).save();
        }

        if(!(await AuthenticationHandler.getAnonymousUser())) {
            await new User({
                username: "Anonymous",
                email: "anonymous@localhost",
                groups: [anonymousGroup._id],
                apiKeys: [],
            }).save();
        }
    }

    private async setupSchema(): Promise<void> {
        await this.initializeDefaultEntries();
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
