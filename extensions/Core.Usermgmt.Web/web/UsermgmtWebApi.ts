import AuthenticationResult from "@extensions/Core.Usermgmt/types/AuthenticationResult";
import Urls from "../urls";
import AuthenticationType from "@extensions/Core.Usermgmt/types/AuthenticationTypes";
import AuthenticationParameters from "@extensions/Core.Usermgmt/types/AuthenticationParameters";
import IUser from "@extensions/Core.Usermgmt/types/IUser";
import IPermissionGroup from "@extensions/Core.Usermgmt/types/IPermissionGroup";

export default class UsermgmtWebApi {
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

    static logout(): Promise<void> {
        return new Promise((res, rej) => {
            fetch(this.buildUrl(Urls.auth.logout), {
                method: "GET",
            }).then(() => {})
                .catch(() => {})
                .finally(() => res());
        });
    }

    static getUsers(): Promise<IUser[]> {
        return this.fetchWrapper(fetch(this.buildUrl(Urls.users.get), {
            method: "GET",
        }), false);
    }

    static async fetchWrapper<T>(response: Promise<Response>, ignoreStatusCode: boolean = false): Promise<T> {
        const finishedResponse = await response;
        const jsonData = await finishedResponse.json();

        if(!ignoreStatusCode && finishedResponse.status !== 200) {
            throw jsonData;
        }

        return jsonData as T;
    }

    static async getUserAuthenticationTypes(username: string): Promise<AuthenticationType["type"][]> {
        return await this.fetchWrapper(fetch(this.buildUrl(Urls.auth.getAuthType, [[/:username/g, username]])));
    }

    static async getPermissionGroups(): Promise<IPermissionGroup[]> {
        return await this.fetchWrapper(fetch(this.buildUrl(Urls.permissions.getGroups)));
    }

    static async getAuthenticationTypes(): Promise<AuthenticationType["type"][]> {
        return await this.fetchWrapper(fetch(this.buildUrl(Urls.auth.getAuthTypes)));
    }

    static startLoginProcess(redirectUri: string): void {
        const url = new URL(location.href);
        url.pathname = "/core.usermgmt.web/login";
        url.searchParams.forEach((value, key) => url.searchParams.delete(key));
        url.searchParams.set("redirect_uri", redirectUri);
        location.href = url.href;
    }

    static buildUrl(path: string, replace: [RegExp, string][] = []): string {
        let finalPath = `${Urls.base}/${path}`;

        for(const [key, value] of replace) {
            finalPath = finalPath.replace(key, value);
        }

        return finalPath;
    }
}
