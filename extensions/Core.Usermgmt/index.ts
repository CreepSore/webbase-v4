import {EventEmitter} from "events";

import IExecutionContext from "@service/extensions/IExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import ConfigLoader from "@logic/config/ConfigLoader";
import CoreDb from "@extensions/Core.Db";
import mongoose, { HydratedDocument } from "mongoose";
import User from "./models/User";
import PermissionGroup from "./models/PermissionGroup";
import Permission from "./models/Permission";
import IPermission from "./types/IPermission";
import Permissions, { PermissionEntry, PermissionLayer } from "./permissions";
import IUser from "./types/IUser";
import IPermissionGroup from "./types/IPermissionGroup";

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

    getRootUser(): Promise<HydratedDocument<IUser>> {
        return User.findOne({username: "Root"}).populate({
            path: "groups",
            populate: {
                path: "permissions",
            },
        });
    }

    getAnonymousUser(): Promise<HydratedDocument<IUser>> {
        return User.findOne({username: "Anonymous"}).populate({
            path: "groups",
            populate: {
                path: "permissions",
            },
        });
    }

    getWildcardPermission(): Promise<HydratedDocument<IPermission>> {
        return this.findPermission(Permissions.ALL);
    }

    findPermission(permission: PermissionEntry): Promise<HydratedDocument<IPermission>> {
        const toFind = typeof permission === "string"
            ? permission
            : permission?.name;

        return Permission.findOne({name: toFind});
    }

    private async createPermissionLayer(
        currentLayer: PermissionLayer,
        currentPath: string = "",
        adminGroup: HydratedDocument<IPermissionGroup> = null,
        anonymousGroup: HydratedDocument<IPermissionGroup> = null,
    ): Promise<void> {
        const _adminGroup = adminGroup ?? await PermissionGroup.findOne({name: "Administrator"});
        const _anonymousGroup = anonymousGroup ?? await PermissionGroup.findOne({name: "Anonymous"});

        for(const [key, value] of Object.entries(currentLayer)) {
            const newPath = currentPath + "/" + key;

            if(value.name) {
                const exists = Boolean(await Permission.findOne({name: value.name, path: newPath}));
                if(exists) {
                    continue;
                }

                const savedPermission = await new Permission({
                    name: value.name,
                    description: value.description,
                    path: newPath,
                }).save();

                if(value.isRoot) {
                    _adminGroup.permissions.push(savedPermission);
                }

                if(value.isAnonymous) {
                    _anonymousGroup.permissions.push(savedPermission);
                }

                continue;
            }

            await this.createPermissionLayer(value as PermissionLayer, newPath, _adminGroup, _anonymousGroup);
        }

        await _adminGroup.save();
        await _anonymousGroup.save();
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

        await this.createPermissionLayer(Permissions);

        if(!(await this.getRootUser())) {
            await new User({
                username: "Root",
                email: "root@localhost",
                groups: [administratorGroup._id],
                apiKeys: [],
            }).save();
        }

        if(!(await this.getAnonymousUser())) {
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
