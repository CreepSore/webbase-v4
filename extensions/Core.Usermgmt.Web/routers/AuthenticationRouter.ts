import * as express from "express";
import Urls from "../urls";
import AuthenticationHandler from "@extensions/Core.Usermgmt/authentication-handlers/AuthenticationHandler";
import User from "@extensions/Core.Usermgmt/models/User";
import { HydratedDocument } from "mongoose";
import IUser from "@extensions/Core.Usermgmt/types/IUser";

export default function createAuthenticationRouter(anonymousUser: HydratedDocument<IUser>): express.Router {
    // eslint-disable-next-line new-cap
    const router = express.Router();

    router.get(Urls.auth.me, async(req, res) => {
        let meUser = await User.findById(req.session.userId);
        if(!meUser) {
            meUser = anonymousUser;
        }

        res.status(200).json(meUser.toObject());
    });

    router.get(Urls.auth.getAuthType, async(req, res) => {
        const authHandler = await AuthenticationHandler.fromUsername(req.params.username);
        res.json(authHandler.getAuthenticationType());
    });

    router.post(Urls.auth.login, async(req, res) => {
        const authHandler = await AuthenticationHandler.fromUsername(req.body.username);
        const authResult = await authHandler.authenticate(req.body);

        if(authResult.success && authResult.userId) {
            req.session.userId = authResult.userId;
        }

        res.status(authResult.success ? 200 : 400).json(authResult);
    });

    return router;
}
