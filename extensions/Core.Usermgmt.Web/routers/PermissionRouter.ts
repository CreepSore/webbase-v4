import * as express from "express";
import Urls from "../urls";
import AuthorizationHandler from "@extensions/Core.Usermgmt/handlers/AuthorizationHandler";
import Permissions from "@extensions/Core.Usermgmt/permissions";
import PermissionGroup from "@extensions/Core.Usermgmt/models/PermissionGroup";
import Permission from "@extensions/Core.Usermgmt/models/Permission";

export default function createPermissionRouter(): express.Router {
    // eslint-disable-next-line new-cap
    const router = express.Router();

    router.get(Urls.permissions.get, AuthorizationHandler.middleware([Permissions.PERMISSIONS.VIEW]), async(req, res) => {
        res.status(200).json(await Permission.find());
    });

    router.get(Urls.permissions.groups.get, AuthorizationHandler.middleware([Permissions.PERMISSIONS.VIEW]), async(req, res) => {
        res.status(200).json(await PermissionGroup.find(null, null, {populate: "permissions"}));
    });

    router.put(Urls.permissions.groups.create, AuthorizationHandler.middleware([Permissions.PERMISSIONS.EDIT]), async(req, res) => {
        const permission = new PermissionGroup(req.body);

        try {
            await permission.save();
            res.status(200).json({success: true});
        }
        catch(ex) {
            res.status(500).json({success: false, error: ex.message});
        }
    });

    router.post(Urls.permissions.groups.edit, AuthorizationHandler.middleware([Permissions.PERMISSIONS.EDIT]), async(req, res) => {
        const permission = await PermissionGroup.findOne({name: req.params.name});

        if(!permission) {
            res.status(400).json({success: false});
            return;
        }

        try {
            await permission.updateOne(req.body);
            res.status(200).json({success: true});
        }
        catch(ex) {
            res.status(500).json({success: false, error: ex.message});
        }
    });

    return router;
}
