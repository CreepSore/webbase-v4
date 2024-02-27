import * as express from "express";
import mongoose, { FilterQuery, HydratedDocument } from "mongoose";
import IUser from "../types/IUser";
import User from "../models/User";
import IPermission from "../types/IPermission";
import LogBuilder from "@service/logger/LogBuilder";
import Permissions, { PermissionEntry, PermissionLayer } from "../permissions";
import Permission from "../models/Permission";
import AuthenticationHandler from "./AuthenticationHandler";
import IPermissionGroup from "../types/IPermissionGroup";
import PermissionGroup from "../models/PermissionGroup";

/**
 * Only use one of the options
 */
type UserFilter = {_id?: mongoose.Types.ObjectId, username?: string};

export default class AuthorizationHandler {
    user: HydratedDocument<IUser>;
    permissions: IPermission[] = [];
    hasWildcardPermission: boolean;

    constructor(user: HydratedDocument<IUser>) {
        if(!user) {
            throw new Error("Invalid user object specified");
        }

        this.user = user;
        this.initialize();
    }

    private initialize(): void {
        this.permissions = (this.user.groups || [])
            .map(g => g.permissions)
            .filter(Boolean)
            .flat(1);

        this.hasWildcardPermission = this.permissions.some(p => p.name === Permissions.ALL.name);
    }

    hasPermissions(...permissions: PermissionEntry[]): boolean {
        if(this.hasWildcardPermission) {
            return true;
        }

        return permissions.every(p => this.permissions.some(up => up.name === p.name));
    }

    static async fromUsername(username: string): Promise<AuthorizationHandler> {
        return new AuthorizationHandler(await this.fetchUser({username}));
    }

    static async fromUserId(id: mongoose.Types.ObjectId): Promise<AuthorizationHandler> {
        return new AuthorizationHandler(await this.fetchUser({_id: id}));
    }

    static async fromRequest(req: express.Request): Promise<AuthorizationHandler> {
        return new AuthorizationHandler(await this.requestToUser(req));
    }

    static fromUserObject(userFilter: UserFilter): Promise<AuthorizationHandler> {
        if(userFilter._id) {
            return this.fromUserId(userFilter._id);
        }
        else if(userFilter.username) {
            return this.fromUsername(userFilter.username);
        }

        throw new Error("Invalid filter specified");
    }

    static middleware(permissions: PermissionEntry[], onErrorCallback?: express.RequestHandler): express.RequestHandler {
        // ! As a matter of fact, because this function is here it
        // ! means that we break the single-responsibility-pattern.
        // ! This SHOULD be inside of Core.Usermgmt.Web, but i think it
        // ! makes more sense if it's here.
        // ! Since it's a static function, i think it's not a big deal.

        return async(req, res, next) => {
            try {
                const authorizationHandler = await this.fromUserId(
                    new mongoose.Types.ObjectId(req.session.userId)
                    || (await AuthenticationHandler.getAnonymousUser())._id,
                );

                if(!authorizationHandler.hasPermissions(...permissions)) {
                    if(onErrorCallback) {
                        onErrorCallback(req, res, next);
                        return;
                    }

                    res.status(400).json({success: false});
                    return;
                }

                next();
            }
            catch(ex) {
                LogBuilder
                    .start()
                    .level("ERROR")
                    .info("AuthorizationHandler")
                    .line("An error occured while trying to initialize the AuthorizationHandler")
                    .object("error", ex)
                    .done();

                if(onErrorCallback) {
                    onErrorCallback(req, res, next);
                    return;
                }

                res.status(500).json({success: false});
            }
        };
    }

    static async requestToUser(req: express.Request): Promise<HydratedDocument<IUser>> {
        return await this.fetchUser({
            _id: new mongoose.Types.ObjectId(req.session.userId)
                || (await AuthenticationHandler.getAnonymousUser())._id,
        });
    }

    static findPermission(permission: PermissionEntry): Promise<HydratedDocument<IPermission>> {
        const toFind = typeof permission === "string"
            ? permission
            : permission?.name;

        return Permission.findOne({name: toFind});
    }

    static getWildcardPermission(): Promise<HydratedDocument<IPermission>> {
        return this.findPermission(Permissions.ALL);
    }

    static async createPermissionLayer(
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

    private static async fetchUser(filter: FilterQuery<IUser>): Promise<HydratedDocument<IUser>> {
        const user = await User.findOne(filter);
        await user.populate({
            path: "groups",
            populate: {
                path: "permissions",
            },
        });

        return user;
    }
}
