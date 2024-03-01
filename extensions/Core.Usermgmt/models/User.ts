import mongoose, { Schema } from "mongoose";
import IUser from "../types/IUser";

const schema = new mongoose.Schema<IUser>({
    username: {type: String, unique: true},
    email: {type: String},
    authentication: [{type: Object}],
    apiKeys: {type: [String]},
    groups: [{type: Schema.Types.ObjectId, required: true, ref: "permission-group"}],
}, {
    timestamps: {
        createdAt: "createdAt",
        updatedAt: "modifiedAt",
    },
});

const User = mongoose.model<IUser>(
    "user",
    schema,
    "user",
);

export default User;
