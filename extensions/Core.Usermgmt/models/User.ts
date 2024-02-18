import * as crypto from "crypto";
import mongoose, { Schema } from "mongoose";
import IUser from "../types/IUser";
import AuthenticationHandler from "../authentication-handlers/AuthenticationHandler";

const schema = new mongoose.Schema<IUser>({
    username: {type: String, unique: true},
    email: {type: String},
    authentication: {type: Object},
    apiKeys: {type: [String]},
    groups: [{type: Schema.Types.ObjectId, required: true, ref: "permission-group"}],
}, {
    timestamps: {
        createdAt: "createdAt",
        updatedAt: "modifiedAt",
    },
});

schema.pre("save", async function(next) {
    if(
        this.authentication?.type !== "password"
        && this.authentication?.type !== "password_totp"
    ) {
        next();
        return;
    }

    if(!this.isModified("authentication.password")) {
        next();
        return;
    }

    this.authentication.password = AuthenticationHandler.hashPassword(this.authentication.password);
    next();
});

const User = mongoose.model<IUser>(
    "user",
    schema,
    "user",
);

export default User;
