import React from "react";
import { IPermissionGroup } from "@extensions/Core.Usermgmt/Interfaces/ModelTypes";
import { useMutation, useQuery } from "@extensions/Core.GraphQL/web/GraphQLHooks";

import "./style.css";

interface PermGroupCreateDialogProps {
    onClose: () => void;
    afterSave: () => void;
}

export default function PermGroupCreateDialog(props: PermGroupCreateDialogProps) {
    const [name, setName] = React.useState("");
    const [description, setDescription] = React.useState("");

    const createGroupMutation = useMutation(`mutation CreatePermGroup($name: String!, $description: String) {
        createPermissionGroup(name: $name, description: $description)
    }`, {
        onSuccess: () => props.afterSave(),
        onError: () => props.afterSave()
    })

    const createPermissionGroup = () => {
        createGroupMutation.execute({
            name,
            description
        });
    };

    return <div className="dialog-container">
        <div className="dialog permgroup-add-dialog">
            <div className="dialog-header">
                <p>Add User</p>
                <div className="dialog-buttons">
                    <button className="dialog-button-close" onClick={() => props.onClose()}>X</button>
                </div>
            </div>
            <div className="dialog-body">
                <label>Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}/>

                <label>Description</label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)}/>

                <div className="flex flex-col gap-1 col-span-1 md:col-span-2 mt-2">
                    <button
                        className="save-button"
                        onClick={() => {
                            createPermissionGroup();
                        }}
                    >Save</button>
                </div>
            </div>
        </div>
    </div>;
}

