import AuthenticationType from "./AuthenticationTypes";
import IPermissionGroup from "./IPermissionGroup";

type IUser = {
    username: string;
    email?: string;
    authentication: AuthenticationType[];
    apiKeys: string[];
    groups: IPermissionGroup[];
};

export default IUser;
