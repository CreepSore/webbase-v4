import * as express from "express";
import Urls from "../urls";
import AuthorizationHandler from "@extensions/Core.Usermgmt/handlers/AuthorizationHandler";
import Permissions from "@extensions/Core.Usermgmt/permissions";
import PermissionGroup from "@extensions/Core.Usermgmt/models/PermissionGroup";

export default function createPermissionRouter(): express.Router {
    // eslint-disable-next-line new-cap
    const router = express.Router();

    router.get(Urls.permissions.getGroups, AuthorizationHandler.middleware([Permissions.PERMISSIONS.VIEW]), async(req, res) => {
        res.status(200).json(await PermissionGroup.find());
    });

    return router;
}
