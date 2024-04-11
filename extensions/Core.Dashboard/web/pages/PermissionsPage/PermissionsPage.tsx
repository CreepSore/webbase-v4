import * as React from "react";

import {DataGrid} from "@mui/x-data-grid/DataGrid";

import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";


import BasePage from "../BasePage/BasePage";
import IPermission from "@extensions/Core.Usermgmt/types/IPermission";
import useFetchApi from "@extensions/Core.React/hooks/useFetchApi";
import IPermissionGroup from "@extensions/Core.Usermgmt/types/IPermissionGroup";
import Loader from "@extensions/Core.React/Loader/Loader";
import AddIcon from "@mui/icons-material/Add";
import MeContext from "@extensions/Core.Usermgmt.Web/web/components/me-provider/MeContext";
import Permissions from "@extensions/Core.Usermgmt/permissions";
import PermissionsPageController from "../../controllers/PermissionsPageController";

type PermissionsRow = IPermission & {
    id: string,
    assigned: boolean,
};

export default function PermissionsPage(): JSX.Element {
    const controller = React.useRef(new PermissionsPageController());

    const me = React.useContext(MeContext);

    const [
        permissionGroups,
        loadingPermissionGroups,
        updatePermissionGroups,
    ] = useFetchApi(() => controller.current.getPermissionGroups(), []);
    const [selPermGroupName, setSelPermGroupName] = React.useState<string>("None");
    const [showNoneEntry, setShowNoneEntry] = React.useState(true);
    const selectedPermissionGroup = React.useMemo<IPermissionGroup>(() => {
        return (permissionGroups || []).find(pg => pg.name === selPermGroupName);
    }, [permissionGroups, selPermGroupName]);

    const [
        permissions,
        loadingPermissions,
    ] = useFetchApi(() => controller.current.getPermissions(), []);

    const isLoading = React.useMemo(() =>
        loadingPermissionGroups
        || loadingPermissions
    , [loadingPermissionGroups, loadingPermissions]);

    const rows = React.useMemo<PermissionsRow[]>(() => {
        if(!selectedPermissionGroup) {
            return [];
        }

        const groupPerms = (selectedPermissionGroup?.permissions || []).map(p => p.name);

        return permissions.sort((a, b) => a.name.localeCompare(b.name)).map((p, i) => ({
            ...p,
            id: p.name,
            assigned: groupPerms.includes(p.name),
        }));
    }, [selectedPermissionGroup, permissionGroups, permissions]);

    const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
    const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
    const [newGroupName, setNewGroupName] = React.useState("");
    const [newGroupDescription, setNewGroupDescription] = React.useState("");

    React.useEffect(() => {
        if(!loadingPermissionGroups) {
            updatePermissionGroups();
        }
    }, [selPermGroupName]);

    React.useEffect(() => {
        if(selectedPermissionGroup) {
            setHasUnsavedChanges(false);
            setShowNoneEntry(false);
        }
    }, [selectedPermissionGroup?.name]);

    return <BasePage>
        {isLoading && <Loader />}

        {createDialogOpen &&
            <Dialog open fullWidth>
                <DialogTitle><h1 className="text-xl font-thin">Create PermissionGroup</h1></DialogTitle>
                <DialogContent>
                    <form onSubmit={(e) => {
                        controller.current.createPermissionGroup({
                            name: newGroupName,
                            description: newGroupDescription,
                        }).then(() => updatePermissionGroups())
                            .then((data) => {
                                setCreateDialogOpen(false);

                                const newGroup = data.find(pg => pg.name === newGroupName);
                                if(newGroup) {
                                    setSelPermGroupName(newGroup.name);
                                }
                            });

                        e.preventDefault();
                    }}>
                        <Stack className="gap-2 pt-2">
                            <TextField
                                label="Name"
                                value={newGroupName}
                                onChange={e => setNewGroupName(e.target.value)}
                            />

                            <TextField
                                label="Description"
                                value={newGroupDescription}
                                onChange={e => setNewGroupDescription(e.target.value)}
                                multiline
                            />

                            <div className="flex justify-end gap-2">
                                <Button type="submit" color="success" variant="outlined">Create</Button>
                                <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                            </div>
                        </Stack>
                    </form>
                </DialogContent>
            </Dialog>
        }

        <Select className="mt-3 mb-2" value={loadingPermissionGroups ? "None" : selPermGroupName} onChange={e => {
            if(e.target.value === "Create") {
                setNewGroupName("");
                setNewGroupDescription("");
                setCreateDialogOpen(true);
                return;
            }

            setSelPermGroupName(e.target.value);
        }}>
            {(showNoneEntry || loadingPermissionGroups) && <MenuItem value="None">None</MenuItem>}

            {me.hasPermission(Permissions.PERMISSIONS.EDIT) &&
                <MenuItem value="Create"><AddIcon /> Create</MenuItem>
            }

            {(permissionGroups || []).map(pg => <MenuItem
                key={pg.name}
                value={pg.name}
            >{pg.name}</MenuItem>)}
        </Select>


        <DataGrid
            columns={[
                {field: "assigned", headerName: "Assigned", type: "boolean", editable: me.hasPermission(Permissions.PERMISSIONS.EDIT)},
                {field: "name", headerName: "Name", flex: 1},
                {field: "description", headerName: "Description", flex: 2},
                {field: "path", headerName: "Path", flex: 2},
            ]}
            rows={rows}
            editMode="cell"
            processRowUpdate={(newRow, oldRow) => {
                const group = selectedPermissionGroup;

                group.permissions = group.permissions
                    .filter(p => p.name !== oldRow.name);

                if(newRow.assigned) {
                    const pushRow: IPermission & {_id: any} = {
                        name: oldRow.name,
                        description: oldRow.description,
                        path: oldRow.path,
                        // @ts-ignore
                        _id: oldRow._id,
                    };

                    group.permissions.push(pushRow);
                }

                setHasUnsavedChanges(true);

                return newRow;
            }}
            getRowClassName={(params) => {
                if(params.row.assigned) {
                    return "text-green-500";
                }
                return "";
            }}
            hideFooterPagination
            hideFooter
        />

        <Snackbar
            open={hasUnsavedChanges}
            message="You have unsaved changes"
            action={<>
                <Button
                    color="success"
                    size="small"
                    onClick={() => {
                        setHasUnsavedChanges(false);

                        controller.current
                            .editPermissionGroup(selectedPermissionGroup)
                            .then(() => updatePermissionGroups());
                    }}
                >Save</Button>
            </>}
        ></Snackbar>
    </BasePage>;
}
