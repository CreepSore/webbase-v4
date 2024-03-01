import IPermission from "./IPermission";

export default interface IPermissionGroup {
    name: string;
    description: string;
    permissions: IPermission[];
}
