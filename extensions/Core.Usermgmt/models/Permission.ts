import mongoose from "mongoose";
import IPermission from "../types/IPermission";

const schema = new mongoose.Schema<IPermission>({
    name: {type: String, required: true, unique: true},
    path: {type: String, required: false, unique: true},
    description: {type: String, required: true},
}, {
    virtuals: {
        fullName: {
            get() {
                if(!this.path) return this.name;

                return `${this.path}/${this.name}`;
            },
        },
    },
});

const Permission = mongoose.model<IPermission>(
    "permission",
    schema,
    "permission",
);

export default Permission;
