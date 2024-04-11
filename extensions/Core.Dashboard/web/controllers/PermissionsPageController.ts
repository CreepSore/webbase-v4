import UsermgmtWebApi from "@extensions/Core.Usermgmt.Web/web/UsermgmtWebApi";
import IPermission from "@extensions/Core.Usermgmt/types/IPermission";
import IPermissionGroup from "@extensions/Core.Usermgmt/types/IPermissionGroup";

type BaseResult = {
    success: boolean;
    error?: string;
};
type EditPermissionGroupResult = BaseResult & {};
type CreatePermissionGroupResult = BaseResult & {};

export default class PermissionsPageController {
    editPermissionGroup(permissionGroup: IPermissionGroup): Promise<EditPermissionGroupResult> {
        if(!permissionGroup) {
            return Promise.resolve({success: false, error: "Invalid permission group provided"});
        }

        if(!permissionGroup.name) {
            return Promise.resolve({success: false, error: "No permission group name provided"});
        }

        return new Promise((res) => {
            UsermgmtWebApi
                .editPermissionGroup(permissionGroup)
                .catch(() => res({success: false}))
                .then(() => res({success: true}));
        });
    }

    createPermissionGroup(permissionGroup: Pick<IPermissionGroup, "name"|"description">): Promise<CreatePermissionGroupResult> {
        return new Promise((res) => {
            UsermgmtWebApi.createPermissionGroup({
                name: permissionGroup.name,
                description: permissionGroup.description,
                permissions: [],
            }).catch(() => res({success: false}))
                .then(() => res({success: true}));
        });
    }

    getPermissionGroups(): Promise<IPermissionGroup[]> {
        try {
            return UsermgmtWebApi.getPermissionGroups();
        }
        catch {
            return Promise.resolve([]);
        }
    }

    getPermissions(): Promise<IPermission[]> {
        try {
            return UsermgmtWebApi.getPermissions();
        }
        catch {
            return Promise.resolve([]);
        }
    }
}
