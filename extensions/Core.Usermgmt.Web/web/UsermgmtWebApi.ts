import AuthenticationResult from "@extensions/Core.Usermgmt/types/AuthenticationResult";
import Urls from "../urls";
import AuthenticationType from "@extensions/Core.Usermgmt/types/AuthenticationTypes";
import AuthenticationParameters from "@extensions/Core.Usermgmt/types/AuthenticationParameters";
import IUser from "@extensions/Core.Usermgmt/types/IUser";

export default class UsermgmtWebApi {
    static async getAuthenticationType(username: string): Promise<AuthenticationType["type"] | "none"> {
        return await this.fetchWrapper(fetch(this.buildUrl(Urls.auth.getAuthType)));
    }

    static me(): Promise<IUser> {
        return this.fetchWrapper(fetch(this.buildUrl(Urls.auth.me)));
    }

    static login(authParameters: AuthenticationParameters & {username: string}): Promise<AuthenticationResult> {
        return this.fetchWrapper(fetch(this.buildUrl(Urls.auth.login), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(authParameters),
        }), true);
    }

    static async fetchWrapper<T>(response: Promise<Response>, ignoreStatusCode: boolean = false): Promise<T> {
        const finishedResponse = await response;
        const jsonData = await finishedResponse.json();

        if(!ignoreStatusCode && finishedResponse.status !== 200) {
            throw jsonData;
        }

        return jsonData as T;
    }

    static buildUrl(path: string): string {
        return `${Urls.base}/${path}`;
    }
}
