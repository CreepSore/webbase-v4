import * as fs from "fs";
import * as path from "path";

import IExecutionContext from "@service/extensions/IExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import ConfigLoader from "@logic/config/ConfigLoader";

import IGraphQLExtension from "../Core.GraphQL/IGraphQLExtension";
import { GraphQLResolveInfo, GraphQLSchema } from "graphql";
import * as GraphQLTools from "@graphql-tools/schema";

import CoreGraphQL from "../Core.GraphQL";
import { Request } from "express";
import { ParsedQs } from "qs";
import User from "../Core.Usermgmt/Models/User";
import PermissionGroup from "../Core.Usermgmt/Models/PermissionGroup";
import Permission from "../Core.Usermgmt/Models/Permission";
import { Knex } from "knex";
import CoreDb from "../Core.Db";

import UsermgmtPermissions from "../Core.Usermgmt.Web/permissions";

class CoreUsermgmtGraphQLConfig {}

export default class CoreUsermgmtGraphQL implements IExtension, IGraphQLExtension {
    metadata: ExtensionMetadata = {
        name: "Core.Usermgmt.GraphQL",
        version: "1.0.0",
        description: "Usermanagement GraphQL Module",
        author: "ehdes",
        dependencies: ["Core.Usermgmt.Web", "Core.GraphQL"]
    };

    config: CoreUsermgmtGraphQLConfig;
    configLoader: ConfigLoader<typeof this.config>;

    db: Knex;
    coreGraphQL: CoreGraphQL;

    constructor() {
        this.config = this.loadConfig();
    }

    async buildGraphQLContext(req: Request<Request<any, any, any, any, Record<string, any>>, undefined, any, ParsedQs, Record<string, any>>) {
        // @ts-ignore
        const session = req.raw.session;
        const uid = session.uid;
        let user: Partial<User> = {
            id: "0",
            username: "Anonymous",
            isActive: false,
            permissionGroupId: 1
        };

        if(uid) {
            user = await User.use().where("id", uid).first();
        }
        
        const permGroup = await PermissionGroup.use().where("id", user.permissionGroupId).first() as PermissionGroup;
        const perms: Permission[] = await this.db.columns("p.name", "p.description", "p.created", "p.modified")
            .from(`${Permission.tableName} as p`)
            .leftJoin("permissiongrouppermissions as pgp", "p.id", "pgp.permission")
            .where({"pgp.permissiongroup": user.permissionGroupId});

        return {
            user: {
                ...user,
                permissionGroup: {
                    ...permGroup,
                    permissions: perms
                },
                pseudo: user.id === "0"
            },
            permissionGroup: permGroup,
            permissions: perms
        };
    }

    buildGraphQLSchema(): GraphQLSchema {
        return GraphQLTools.makeExecutableSchema({
            typeDefs: fs.readFileSync(path.join(this.metadata.extensionPath, "schema.graphql"), "utf8"),
            resolvers: {
                Query: {
                    me: (parent, args, context, info) => this.handleMeQuery(parent, args, context, info),
                    users: (parent, args, context, info) => this.handleUsersQuery(parent, args, context, info),
                    userById: (parent, args, context, info) => this.handleUserByIdQuery(parent, args, context, info),
                    permissionGroups: (parent, args, context, info) => this.handlePermissionGroupsQuery(parent, args, context, info),
                    permissionGroupById: (parent, args, context, info) => this.handlePermissionGroupByIdQuery(parent, args, context, info),
                    permissionGroupByName: (parent, args, context, info) => this.handlePermissionGroupByNameQuery(parent, args, context, info),
                    permissions: (parent, args, context, info) => this.handlePermissionsQuery(parent, args, context, info),
                    permissionById: (parent, args, context, info) => this.handlePermissionByIdQuery(parent, args, context, info),
                    permissionByName: (parent, args, context, info) => this.handlePermissionByNameQuery(parent, args, context, info)
                },
                Mutator: {
                    loginByCredentials: (parent, args, context, info) => this.handleLoginByCredentialsMutation(parent, args, context, info),
                    loginByApiKeyasync: (parent, args, context, info) => this.handleLoginByApiKeyMutation(parent, args, context, info),
                    logout: (parent, args, context, info) => this.handleLogoutMutation(parent, args, context, info)
                }
            },
            
        });
    }

    //#region Usermgmt
    async handleMeQuery(parent: any, args: any, context: any, info: GraphQLResolveInfo) {
        return context.user;
    }

    async handleUsersQuery(parent: any, args: any, context: any, info: GraphQLResolveInfo) {
        if(!this.hasPermissions(context, UsermgmtPermissions.ViewUser.name)) {
            throw new Error("Invalid Permissions");
        }

        const infoTree = this.coreGraphQL.fieldsFromResolveInfo(info);

        return await Promise.all((await User.use().select()).map(async(user: Partial<User>) => {
            return await this.userToGraphQlObject(context, user, infoTree.permissionGroup, infoTree.permissionGroup?.permissions);
        }));
    }

    async handleUserByIdQuery(parent: any, args: any, context: any, info: GraphQLResolveInfo) {
        if(!this.hasPermissions(context, UsermgmtPermissions.ViewUser.name)) {
            throw new Error("Invalid Permissions");
        }

        const user = await User.use().where("id", args.id).first();
        if(!user) throw new Error("Invalid User Id");

        const infoTree = this.coreGraphQL.fieldsFromResolveInfo(info);
        return await this.userToGraphQlObject(context, user, infoTree.permissionGroup, infoTree.permissionGroup?.permissions);
    }

    async handlePermissionGroupsQuery(parent: any, args: any, context: any, info: GraphQLResolveInfo) {
        if(!this.hasPermissions(context, UsermgmtPermissions.ViewPermissions.name)) {
            throw new Error("Invalid Permissions");
        }
        const infoTree = this.coreGraphQL.fieldsFromResolveInfo(info);
        
        return await Promise.all((await PermissionGroup.use().select()).map(pg => this.permissionGroupToGraphQlObject(context, pg, infoTree.permissions)));
    }

    async handlePermissionGroupByIdQuery(parent: any, args: any, context: any, info: GraphQLResolveInfo) {
        if(!this.hasPermissions(context, UsermgmtPermissions.ViewPermissions.name)) {
            throw new Error("Invalid Permissions");
        }

        const infoTree = this.coreGraphQL.fieldsFromResolveInfo(info);
        return await this.permissionGroupToGraphQlObject(context, await PermissionGroup.use().where("id", args.id).first(), infoTree.permissions);
    }

    async handlePermissionGroupByNameQuery(parent: any, args: any, context: any, info: GraphQLResolveInfo) {
        if(!this.hasPermissions(context, UsermgmtPermissions.ViewPermissions.name)) {
            throw new Error("Invalid Permissions");
        }
        const infoTree = this.coreGraphQL.fieldsFromResolveInfo(info);
        return await this.permissionGroupToGraphQlObject(context, await PermissionGroup.use().where("name", args.name).first(), infoTree.permissions);
    }

    async handlePermissionsQuery(parent: any, args: any, context: any, info: GraphQLResolveInfo) {
        if(!this.hasPermissions(context, UsermgmtPermissions.ViewPermissions.name)) {
            throw new Error("Invalid Permissions");
        }
        return await this.permissionsToGraphQlObject(await Permission.use().select());
    }

    async handlePermissionByIdQuery(parent: any, args: any, context: any, info: GraphQLResolveInfo) {
        if(!this.hasPermissions(context, UsermgmtPermissions.ViewPermissions.name)) {
            throw new Error("Invalid Permissions");
        }
        return await this.permissionsToGraphQlObject(await Permission.use().where("id", args.id).first());
    }

    async handlePermissionByNameQuery(parent: any, args: any, context: any, info: GraphQLResolveInfo) {
        if(!this.hasPermissions(context, UsermgmtPermissions.ViewPermissions.name)) {
            throw new Error("Invalid Permissions");
        }
        return await this.permissionsToGraphQlObject(await Permission.use().where("name", args.id).first());
    }

    async userToGraphQlObject(context: any, user: Partial<User>, loadPermGroup: boolean, loadPerms: boolean) {
        if(!this.hasPermissions(context, UsermgmtPermissions.ViewUser.name)) {
            throw new Error("Invalid Permissions");
        }

        let permissionGroup: Partial<PermissionGroup> = null;
        let permGroupError = null;

        if(loadPermGroup) {
            if(this.hasPermissions(context, UsermgmtPermissions.ViewPermissions.name)) {
                permissionGroup = await PermissionGroup.use().where("id", user.permissionGroupId).first() as PermissionGroup;
            }
            else {
                permGroupError = new Error("Invalid Permissions to fetch PermissionGroup");
            }
        }

        return {
            id: user.id,
            username: user.username,
            email: user.email,
            password: user.password,
            isActive: user.isActive,
            permissionGroup: permGroupError || await this.permissionGroupToGraphQlObject(context, permissionGroup, loadPerms),
            pseudo: false
        }
    }

    async permissionGroupToGraphQlObject(context: any, group: Partial<PermissionGroup>, loadPerms: boolean) {
        const perms = await this.permissionsByPermissionGroup(group.id);
        return {
            id: group.id,
            name: group.name,
            description: group.description,
            permissions: perms && await this.permissionsToGraphQlObject(perms)
        };
    }

    async permissionsToGraphQlObject(permissions: Permission[]) {
        return permissions ?? permissions.map(perm => {
            return {
                id: perm.id,
                name: perm.name,
                description: perm.description
            };
        });
    }
    //#endregion

    //#region Session
    async handleLoginByCredentialsMutation(parent, args, context, info) {

    }

    async handleLoginByApiKeyMutation(parent, args, context, info) {
        
    }

    async handleLogoutMutation(parent, args, context, info) {
        
    }
    //#endregion

    hasPermissions(context: any, ...permissionNames: string[]) {
        if(permissionNames.length === 0) return true;

        const permissions: string[] = context.permissions.map((perm: Permission) => perm.name);
        return permissionNames.map(name => permissions.includes(name)).every(Boolean);
    }

    async start(executionContext: IExecutionContext) {
        this.checkConfig();
        if(executionContext.contextType === "cli") {
            return;
        }

        const coreDb = executionContext.extensionService.getExtension("Core.Db") as CoreDb;
        this.coreGraphQL = executionContext.extensionService.getExtension("Core.GraphQL") as CoreGraphQL;
        this.db = coreDb.db;

        const coreGraphQL = executionContext.extensionService.getExtension("Core.GraphQL") as CoreGraphQL;
        coreGraphQL.registerExtension(this);
    }

    async stop() {

    }

    private async permissionsByPermissionGroup(permissionGroupId: number) {
        return await this.db.columns("p.name", "p.description", "p.created", "p.modified")
            .from(`${Permission.tableName} as p`)
            .leftJoin("permissiongrouppermissions as pgp", "p.id", "pgp.permission")
            .where({"pgp.permissiongroup": permissionGroupId});
    }

    private checkConfig() {
        if(!this.config) {
            throw new Error(`Config could not be found at [${this.configLoader.configPath}]`);
        }
    }

    private loadConfig() {
        let model = new CoreUsermgmtGraphQLConfig();
        if(Object.keys(model).length === 0) return model;

        let [cfgname, templatename] = this.generateConfigNames();
        this.configLoader = new ConfigLoader(cfgname, templatename);
        let cfg = this.configLoader.createTemplateAndImport(model);

        return cfg;
    }

    private generateConfigNames() {
        return [
            ConfigLoader.createConfigPath(`${this.metadata.name}.json`),
            ConfigLoader.createConfigPath(`${this.metadata.name}.template.json`)
        ];
    }
}
