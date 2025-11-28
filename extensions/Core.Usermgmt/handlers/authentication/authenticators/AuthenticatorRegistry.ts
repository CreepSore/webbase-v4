import { HydratedDocument } from "mongoose";
import IUser from "../../../types/IUser";
import IAuthenticator from "./IAuthenticator";

export default class AuthenticatorRegistry {
    private _builders: Map<string, (user: HydratedDocument<IUser>) => IAuthenticator<any, any>> = new Map();

    registerBuilder(type: string, builder: (user: HydratedDocument<IUser>) => IAuthenticator<any, any>): this {
        if(this._builders.has(type)) {
            throw new Error(`Builder with type [${type}] already registered!`);
        }

        this._builders.set(type, builder);
        return this;
    }

    get(type: string, user: HydratedDocument<IUser>): IAuthenticator<any, any> {
        const builder = this._builders.get(type);

        if(builder === undefined) {
            return null;
        }

        return this._builders.get(type)?.(user);
    }
}
