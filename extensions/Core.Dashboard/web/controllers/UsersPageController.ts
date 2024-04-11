import UsermgmtWebApi from "@extensions/Core.Usermgmt.Web/web/UsermgmtWebApi";
import IUser from "@extensions/Core.Usermgmt/types/IUser";

type BaseResult = {
    success: boolean;
    error?: string;
};

type DeleteUsersResult = BaseResult & {

};

type ImpersonateUserResult = BaseResult & {

};

export default class UsersPageController {
    deleteUser(user: IUser): Promise<DeleteUsersResult> {
        if(!user) {
            return Promise.resolve({success: false, error: "Invalid User specified"});
        }

        return new Promise((res, rej) => {
            UsermgmtWebApi
                .deleteUser(user)
                .catch(() => {})
                .then(() => {
                    res({success: true});
                });
        });
    }

    impersonateUser(user: IUser): Promise<ImpersonateUserResult> {
        if(!user) {
            return Promise.resolve({success: false, error: "Invalid User specified"});
        }

        return new Promise((res) => {
            UsermgmtWebApi
                .impersonateUser(user)
                .catch(() => res({success: false}))
                .then(() => res({success: true}));
        });
    }

    getUsers(): Promise<IUser[]> {
        return UsermgmtWebApi.getUsers();
    }
}
