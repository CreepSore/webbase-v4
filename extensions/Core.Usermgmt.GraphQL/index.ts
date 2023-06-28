/* eslint-disable @typescript-eslint/explicit-function-return-type */
// ! No, thank you very much
import * as fs from "fs";
import * as path from "path";

import * as uuid from "uuid";
import IGraphQLExtension from "@extensions/Core.GraphQL/IGraphQLExtension";
import { GraphQLResolveInfo, GraphQLSchema } from "graphql";
import * as GraphQLTools from "@graphql-tools/schema";
import CoreGraphQL from "@extensions/Core.GraphQL";
import { Request } from "express";
import { ParsedQs } from "qs";
import User from "@extensions/Core.Usermgmt/Models/User";
import PermissionGroup from "@extensions/Core.Usermgmt/Models/PermissionGroup";
import Permission from "@extensions/Core.Usermgmt/Models/Permission";
import { Knex } from "knex";
import CoreDb from "@extensions/Core.Db";

import IExecutionContext from "@service/extensions/IExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import ConfigLoader from "@logic/config/ConfigLoader";
import UsermgmtPermissions from "@extensions/Core.Usermgmt.Web/permissions";
import CoreUsermgmt from "@extensions/Core.Usermgmt";
import ApiKey from "@extensions/Core.Usermgmt/Models/ApiKey";

class CoreUsermgmtGraphQLConfig {}

export default class CoreUsermgmtGraphQL implements IExtension, IGraphQLExtension {
    metadata: ExtensionMetadata = {
        name: "Core.Usermgmt.GraphQL",
        version: "1.0.0",
        description: "Usermanagement GraphQL Module",
        author: "ehdes",
        dependencies: ["Core.Usermgmt.Web", "Core.GraphQL"],
    };

    config: CoreUsermgmtGraphQLConfig;

    db: Knex;
    coreGraphQL: CoreGraphQL;
    coreUsermgmt: CoreUsermgmt;

    constructor() {
        this.config = this.loadConfig(true);
    }

    async buildGraphQLContext(req: Request<Request<any, any, any, any, Record<string, any>>, undefined, any, ParsedQs, Record<string, any>>): Promise<{
        user: Partial<User> & {
            permissionGroup: PermissionGroup & {
                permissions: Permission[],
            },
            pseudo: boolean,
        },
        permissionGroup: PermissionGroup,
        permissions: Permission[],
        apiKeys: ApiKey[],
    }> {
        // @ts-ignore
        const {session} = req.raw;
        const {uid} = session;
        let user: Partial<User> = {
            id: "0",
            username: "Anonymous",
            isActive: false,
            permissionGroupId: 1,
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
                    permissions: perms,
                },
                pseudo: user.id === "0",
            },
            permissionGroup: permGroup,
            permissions: perms,
            // @ts-ignore
            apiKeys: (await ApiKey.use().where("userId", user.id)).map(apiKey => {
                return {id: apiKey.id, validUntil: new Date(apiKey.validUntil).toISOString(), userId: apiKey.userId};
            }),
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
                    permissionByName: (parent, args, context, info) => this.handlePermissionByNameQuery(parent, args, context, info),
                    apiKeys: (parent, args, context, info) => this.handleApiKeysQuery(parent, args, context, info),
                },
                Mutation: {
                    loginByCredentials: (parent, args, context, info) => this.handleLoginByCredentialsMutation(parent, args, context, info),
                    loginByApiKey: (parent, args, context, info) => this.handleLoginByApiKeyMutation(parent, args, context, info),
                    logout: (parent, args, context, info) => this.handleLogoutMutation(parent, args, context, info),
                    updateUser: (parent, args, context, info) => this.handleUpdateUserMutation(parent, args, context, info),
                    createUser: (parent, args, context, info) => this.handleCreateUserMutation(parent, args, context, info),
                    deleteUser: (parent, args, context, info) => this.handleDeleteUserMutation(parent, args, context, info),
                    impersonateUser: (parent, args, context, info) => this.handleImpersonateUserMutation(parent, args, context, info),
                    addPermissionToGroup: (parent, args, context, info) => this.handleAddPermissionToGroupMutation(parent, args, context, info),
                    removePermissionFromGroup: (parent, args, context, info) =>this.handleRemovePermissionFromGroupMutation(parent, args, context, info),
                    createPermissionGroup: (parent, args, context, info) => this.handleCreatePermissionGroupMutation(parent, args, context, info),
                    addApiKeyToUser: (parent, args, context, info) => this.handleAddApiKeyToUserMutation(parent, args, context, info),
                    deleteApiKey: (parent, args, context, info) => this.handleDeleteApiKeyFromUserMutation(parent, args, context, info),
                },
            },
        });
    }

    // #region Usermgmt
    // #region Usermgmt :: Queries
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

    async handleApiKeysQuery(parent: any, args: any, context: any, info: GraphQLResolveInfo) {
        if(!this.hasPermissions(context, UsermgmtPermissions.ViewUser.name)) {
            throw new Error("Invalid Permissions");
        }

        return await Promise.all((await ApiKey.use().select()).map(async(apiKey: Partial<ApiKey>) => {
            return {
                id: apiKey.id,
                validUntil: apiKey.validUntil.getTime(),
                userId: apiKey.userId,
            };
        }));
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

        const apiKeys = (await ApiKey.use().where("userId", user.id)).map(apiKey => {
            return {id: apiKey.id, validUntil: new Date(apiKey.validUntil).toISOString(), userId: apiKey.userId};
        });

        const result = {
            id: user.id,
            username: user.username,
            email: user.email,
            password: user.password,
            isActive: user.isActive,
            permissionGroup: permGroupError || (loadPermGroup && await this.permissionGroupToGraphQlObject(context, permissionGroup, loadPerms)),
            pseudo: false,
            apiKeys,
        };

        return result;
    }

    async permissionGroupToGraphQlObject(context: any, group: Partial<PermissionGroup>, loadPerms: boolean) {
        const perms = await this.permissionsByPermissionGroup(group.id);
        return {
            id: group.id,
            name: group.name,
            description: group.description,
            permissions: perms && await this.permissionsToGraphQlObject(perms),
        };
    }

    async permissionsToGraphQlObject(permissions: Permission[]) {
        return permissions ?? permissions.map(perm => {
            return {
                id: perm.id,
                name: perm.name,
                description: perm.description,
            };
        });
    }
    // #endregion

    // #region Usermgmt :: Mutations
    async handleUpdateUserMutation(parent: any, args: any, context: any, info: GraphQLResolveInfo) {
        if(!this.hasPermissions(context, UsermgmtPermissions.EditUser.name)) {
            throw new Error("Invalid Permissions");
        }

        const {id, username, email, password, isActive, permissionGroupId} = args;
        const updateValues: {[key: string]: any} = {};

        if(username) updateValues.username = username;
        if(email !== null) updateValues.email = email;
        if(password) updateValues.password = User.hashPassword(password);
        if(isActive === true || isActive === false) updateValues.isActive = isActive ? 1 : 0;
        if(permissionGroupId) updateValues.permissionGroupId = permissionGroupId;

        updateValues.modified = new Date();
        await User.use().update(updateValues).where({id});
        return true;
    }

    async handleCreateUserMutation(parent: any, args: any, context: any, info: GraphQLResolveInfo) {
        if(!this.hasPermissions(context, UsermgmtPermissions.CreateUser.name)) {
            throw new Error("Invalid Permissions");
        }

        const id = uuid.v4();
        const {username} = args;
        let {email, password, isActive, permissionGroupId} = args;

        if(!username || !password) {
            throw new Error("Some mandatory fields are missing");
        }

        if(!permissionGroupId) permissionGroupId = 1;
        if(!email) email = "";
        if(isActive !== false && isActive !== true) isActive = false;
        password = User.hashPassword(password);

        await User.use().insert({
            id,
            username,
            email,
            password,
            isActive: isActive === true ? 1 : 0,
            permissionGroupId,
            created: new Date(),
        });
        return true;
    }

    async handleDeleteUserMutation(parent: any, args: any, context: any, info: GraphQLResolveInfo) {
        if(!this.hasPermissions(context, UsermgmtPermissions.DeleteUser.name)) {
            throw new Error("Invalid Permissions");
        }

        const {id} = args;

        await User.use().delete().where({id});
        return true;
    }

    async handleImpersonateUserMutation(parent: any, args: any, context: any, info: GraphQLResolveInfo) {
        if(!(context.req.session.acceptedCookies || []).includes("mandatory")) throw Error("Cookies not accepted");

        if(!this.hasPermissions(context, UsermgmtPermissions.ImpersonateUser.name)) {
            throw new Error("Invalid Permissions");
        }

        const {id} = args;
        context.req.session.uid = id;
        return true;
    }

    async handleAddPermissionToGroupMutation(parent: any, args: any, context: any, info: GraphQLResolveInfo) {
        if(!this.hasPermissions(context, UsermgmtPermissions.EditPermissions.name)) {
            throw new Error("Invalid Permissions");
        }

        const {permissionGroupId, permissionId} = args;

        await PermissionGroup.addPermission({id: permissionGroupId}, {id: permissionId});
        return true;
    }

    async handleRemovePermissionFromGroupMutation(parent: any, args: any, context: any, info: GraphQLResolveInfo) {
        if(!this.hasPermissions(context, UsermgmtPermissions.EditPermissions.name)) {
            throw new Error("Invalid Permissions");
        }

        const {permissionGroupId, permissionId} = args;
        await PermissionGroup.removePermission({id: permissionGroupId}, {id: permissionId});
        return true;
    }

    async handleCreatePermissionGroupMutation(parent: any, args: any, context: any, info: GraphQLResolveInfo) {
        if(!this.hasPermissions(context, UsermgmtPermissions.EditPermissions.name)) {
            throw new Error("Invalid Permissions");
        }

        const {name, description} = args;
        await PermissionGroup.create({name, description});
        return true;
    }

    async handleAddApiKeyToUserMutation(parent: any, args: any, context: any, info: GraphQLResolveInfo) {
        if(!this.hasPermissions(context, UsermgmtPermissions.EditUser.name)) {
            throw new Error("Invalid Permissions");
        }

        const {userId} = args;
        const user = await User.use().where({id: userId}).first();
        if(!user) throw new Error("INVALID_USER");

        const apiKeyId = uuid.v4();
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + 365);

        await ApiKey.use().insert({
            id: apiKeyId,
            userId,
            created: new Date(),
            validUntil,
        });

        return apiKeyId;
    }

    async handleDeleteApiKeyFromUserMutation(parent: any, args: any, context: any, info: GraphQLResolveInfo) {
        if(!this.hasPermissions(context, UsermgmtPermissions.EditUser.name)) {
            throw new Error("Invalid Permissions");
        }

        const count = await ApiKey.use().delete().where({id: args.apiKeyId});
        return count > 0;
    }
    // #endregion
    // #endregion

    // #region Session
    async handleLoginByCredentialsMutation(parent: any, args: any, context: any, info: GraphQLResolveInfo) {
        if(!(context.req.session.acceptedCookies || []).includes("mandatory")) throw Error("Cookies not accepted");
        const {username, password} = args;
        // ! this throws
        const result = await this.coreUsermgmt.loginByCredentials({username, password});
        context.req.session.uid = result.id;
        return result.id;
    }

    async handleLoginByApiKeyMutation(parent: any, args: any, context: any, info: GraphQLResolveInfo) {
        if(!(context.req.session.acceptedCookies || []).includes("mandatory")) throw Error("Cookies not accepted");
        const {apiKey} = args;
        // ! this throws
        const result = await this.coreUsermgmt.loginByApiKey(apiKey);

        context.req.session.uid = result.id;
        return result.id;
    }

    async handleLogoutMutation(parent: any, args: any, context: any, info: GraphQLResolveInfo) {
        if(context.req.session.uid) {
            context.req.session.uid = null;
            return true;
        }
        return false;
    }
    // #endregion

    hasPermissions(context: any, ...permissionNames: string[]) {
        if(permissionNames.length === 0) return true;

        const permissions: string[] = context.permissions.map((perm: Permission) => perm.name);
        return permissionNames.map(name => permissions.includes(name)).every(Boolean);
    }

    async start(executionContext: IExecutionContext): Promise<void> {
        this.checkConfig();
        if(executionContext.contextType === "cli") {
            return;
        }

        const coreDb = executionContext.extensionService.getExtension("Core.Db") as CoreDb;
        this.coreGraphQL = executionContext.extensionService.getExtension("Core.GraphQL") as CoreGraphQL;
        this.coreUsermgmt = executionContext.extensionService.getExtension("Core.Usermgmt") as CoreUsermgmt;
        this.db = coreDb.db;

        const coreGraphQL = executionContext.extensionService.getExtension("Core.GraphQL") as CoreGraphQL;
        coreGraphQL.registerExtension(this);
    }

    async stop(): Promise<void> {

    }

    private async permissionsByPermissionGroup(permissionGroupId: number) {
        return await this.db.columns("p.id", "p.name", "p.description", "p.created", "p.modified")
            .from(`${Permission.tableName} as p`)
            .leftJoin("permissiongrouppermissions as pgp", "p.id", "pgp.permission")
            .where({"pgp.permissiongroup": permissionGroupId});
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
            new CoreUsermgmtGraphQLConfig(),
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
