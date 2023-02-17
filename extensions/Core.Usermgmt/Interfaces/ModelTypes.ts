export interface IPermission {
    id: number;
    name: string;
    description?: string;
}

export interface IPermissionGroup {
    id: number;
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
