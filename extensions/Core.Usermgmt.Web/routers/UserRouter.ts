import * as express from "express";
import Urls from "../urls";
import AuthorizationHandler from "@extensions/Core.Usermgmt/handlers/AuthorizationHandler";
import User from "@extensions/Core.Usermgmt/models/User";
import AuthenticationHandler from "@extensions/Core.Usermgmt/handlers/AuthenticationHandler";
import Permissions from "@extensions/Core.Usermgmt/permissions";
import AuthenticationType from "@extensions/Core.Usermgmt/types/AuthenticationTypes";

export default function createUserRouter(): express.Router {
    // eslint-disable-next-line new-cap
    const router = express.Router();

    router.get(Urls.auth.me, async(req, res) => {
        let meUser = await User.findById(req.session.userId, null, {
            populate: [
                {
                    path: "groups",
                    populate: {
                        path: "permissions",
                    },
                },
            ],
        });

        if(!meUser) {
            meUser = await AuthenticationHandler.getAnonymousUser();
        }

        const result = meUser.toObject();
        delete result.authentication;

        res.status(200).json(result);
    });

    router.get(Urls.users.get, AuthorizationHandler.middleware([Permissions.USERS.VIEW]), async(req, res) => {
        res.status(200).json(await User.find(null, null, {
            populate: [
                {
                    path: "groups",
                    populate: {
                        path: "permissions",
                    },
                },
                {
                    path: "authentication",
                },
            ],
        }));
    });

    router.put(Urls.users.create, AuthorizationHandler.middleware([Permissions.USERS.EDIT]), async(req, res) => {
        try {
            const user = new User(req.body);
            user.authentication = (user.authentication || []).map((a: AuthenticationType & {wasEdited: boolean}) => {
                if(a.type === "password" && a.wasEdited) {
                    return {
                        type: "password",
                        password: AuthenticationHandler.hashPassword(a.password),
                    };
                }
                else if(a.type === "password_totp" && a.wasEdited) {
                    return {
                        type: "password_totp",
                        password: AuthenticationHandler.hashPassword(a.password),
                        secret: a.secret,
                    };
                }

                const newAuthType = {
                    ...a,
                };
                delete newAuthType.wasEdited;

                return newAuthType;
            });

            await user.save();
            res.status(200).json({success: true});
        }
        catch(ex) {
            res.status(500).json({success: false, error: ex.message});
        }
    });

    router.post(Urls.users.impersonate, AuthorizationHandler.middleware([Permissions.USERS.IMPERSONATE]), async(req, res) => {
        try {
            const user = await User.findOne({username: req.params.name});

            if(!user) {
                res.status(400).json({success: false});
                return;
            }

            req.session.userId = user._id.toString();

            res.status(200).json({success: true});
        }
        catch(ex) {
            res.status(500).json({success: false, error: ex.message});
        }
    });

    router.post(Urls.users.edit, AuthorizationHandler.middleware([Permissions.USERS.EDIT]), async(req, res) => {
        try {
            const user = await User.findOne({username: req.params.name});

            if(!user) {
                res.status(400).json({success: false});
                return;
            }

            const newAuthentication = (req.body.authentication || []).map((a: AuthenticationType & {wasEdited: boolean}) => {
                if(a.type === "password" && a.wasEdited) {
                    return {
                        type: "password",
                        password: AuthenticationHandler.hashPassword(a.password),
                    };
                }
                else if(a.type === "password_totp" && a.wasEdited) {
                    return {
                        type: "password_totp",
                        password: AuthenticationHandler.hashPassword(a.password),
                        secret: a.secret,
                    };
                }

                const newAuthType = {
                    ...a,
                };
                delete newAuthType.wasEdited;

                return newAuthType;
            });

            await user.updateOne({
                ...req.body,
                authentication: newAuthentication,
            });
            res.status(200).json({success: true});
        }
        catch(ex) {
            res.status(500).json({success: false, error: ex.message});
        }
    });

    router.delete(Urls.users.delete, AuthorizationHandler.middleware(([Permissions.USERS.DELETE])), async(req, res) => {
        try {
            const user = await User.findOne({username: req.params.name});

            if(!user) {
                res.status(400).json({success: false});
                return;
            }

            await user.deleteOne();

            res.status(200).json({success: true});
        }
        catch(ex) {
            res.status(500).json({success: false, error: ex.message});
        }
    });

    return router;
}
