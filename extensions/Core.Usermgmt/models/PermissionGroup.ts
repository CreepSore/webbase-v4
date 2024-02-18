import mongoose, { Schema } from "mongoose";
import IPermissionGroup from "../types/IPermissionGroup";

const schema = new mongoose.Schema<IPermissionGroup>({
    name: {type: String, required: true},
    description: {type: String, required: true},
    permissions: [{type: Schema.Types.ObjectId, ref: "permission"}],
});

const PermissionGroup = mongoose.model<IPermissionGroup>(
    "permission-group",
    schema,
    "permission-group",
);

export default PermissionGroup;
