import * as express from "express";
import Urls from "../urls";
import AuthenticationHandler from "@extensions/Core.Usermgmt/handlers/AuthenticationHandler";
import User from "@extensions/Core.Usermgmt/models/User";
import AuthorizationHandler from "@extensions/Core.Usermgmt/handlers/AuthorizationHandler";
import Permissions from "@extensions/Core.Usermgmt/permissions";
import AuthenticationType from "@extensions/Core.Usermgmt/types/AuthenticationTypes";

export default function createAuthenticationRouter(): express.Router {
    // eslint-disable-next-line new-cap
    const router = express.Router();

    router.get(Urls.auth.me, async(req, res) => {
        let meUser = await User.findById(req.session.userId);
        if(!meUser) {
            meUser = await AuthenticationHandler.getAnonymousUser();
        }

        await meUser.populate({
            path: "groups",
            populate: {
                path: "permissions",
            },
        });

        const result = meUser.toObject();
        delete result.authentication;

        res.status(200).json(result);
    });

    router.get(Urls.users.get, AuthorizationHandler.middleware([Permissions.USERS.VIEW]), async(req, res) => {
        res.status(200).json(await User.find());
    });

    router.get(Urls.auth.getAuthType, async(req, res) => {
        const authHandler = await AuthenticationHandler.fromUsername(req.params.username);
        res.json(authHandler.getAuthenticationTypes());
    });

    router.get(Urls.auth.logout, async(req, res) => {
        req.session.userId = null;
        res.json({success: true});
    });

    router.post(Urls.auth.login, async(req, res) => {
        const authHandler = await AuthenticationHandler.fromUsername(req.body.username);
        const authResult = await authHandler.authenticate(req.body);

        if(authResult.success && authResult.userId) {
            req.session.userId = authResult.userId;
        }

        res.status(authResult.success ? 200 : 400).json(authResult);
    });

    router.get(Urls.auth.getAuthTypes, AuthorizationHandler.middleware([Permissions.AUTH.VIEW_TYPES]), async(req, res) => {
        res.status(200).json(["password", "password_totp", "totp", "once_key", "permanent_key"] as AuthenticationType["type"][]);
    });

    return router;
}
