export interface IPermission {
    id: string;
    name: string;
    description?: string;
}

export interface IPermissionGroup {
    id: string;
    name: string;
    description?: string;
    permissions?: IPermission[];
}

export default interface IUser {
    id?: string;
    pseudo: boolean;
    username: string;
    email?: string;
    password: string;
    isActive: boolean;
    permissionGroup?: IPermissionGroup;
}
