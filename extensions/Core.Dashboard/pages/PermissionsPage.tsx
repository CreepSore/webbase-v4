import * as React from "react";
import BasePage from "./BasePage";
import { DataGrid } from "@mui/x-data-grid";
import IPermission from "@extensions/Core.Usermgmt/types/IPermission";
import useFetchApi from "@extensions/Core.React/hooks/useFetchApi";
import UsermgmtWebApi from "@extensions/Core.Usermgmt.Web/web/UsermgmtWebApi";
import { Button, Dialog, DialogContent, DialogTitle, MenuItem, Select, Snackbar, Stack, TextField } from "@mui/material";
import IPermissionGroup from "@extensions/Core.Usermgmt/types/IPermissionGroup";
import Loader from "@extensions/Core.React/Loader/Loader";
import AddIcon from "@mui/icons-material/Add";
import MeContext from "@extensions/Core.Usermgmt.Web/web/components/me-provider/MeContext";
import Permissions from "@extensions/Core.Usermgmt/permissions";
import PermissionCheck from "@extensions/Core.Usermgmt.Web/web/components/PermissionCheck";

type PermissionsRow = IPermission & {
    id: string,
    assigned: boolean,
};

export default function PermissionsPage(): JSX.Element {
    const me = React.useContext(MeContext);

    const [
        permissionGroups,
        loadingPermissionGroups,
        updatePermissionGroups,
    ] = useFetchApi(() => UsermgmtWebApi.getPermissionGroups(), []);
    const [selPermGroupName, setSelPermGroupName] = React.useState<string>("None");
    const [showNoneEntry, setShowNoneEntry] = React.useState(true);
    const selectedPermissionGroup = React.useMemo<IPermissionGroup>(() => {
        return (permissionGroups || []).find(pg => pg.name === selPermGroupName);
    }, [permissionGroups, selPermGroupName]);

    const [
        permissions,
        loadingPermissions,
    ] = useFetchApi(() => UsermgmtWebApi.getPermissions(), []);

    const isLoading = React.useMemo(() =>
        loadingPermissionGroups
        || loadingPermissions
    , [loadingPermissionGroups, loadingPermissions]);

    const rows = React.useMemo<PermissionsRow[]>(() => {
        if(!selectedPermissionGroup) {
            return [];
        }

        const groupPerms = (selectedPermissionGroup?.permissions || []).map(p => p.name);

        return permissions.map((p, i) => ({
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
                        UsermgmtWebApi.createPermissionGroup({
                            name: newGroupName,
                            description: newGroupDescription,
                            permissions: [],
                        }).then(() => {
                            updatePermissionGroups().then((data) => {
                                setCreateDialogOpen(false);

                                const newGroup = data.find(pg => pg.name === newGroupName);
                                if(newGroup) {
                                    setSelPermGroupName(newGroup.name);
                                }
                            });
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

        <Select value={loadingPermissionGroups ? "None" : selPermGroupName} onChange={e => {
            if(e.target.value === "Create") {
                setNewGroupName("");
                setNewGroupDescription("");
                setCreateDialogOpen(true);
                return;
            }

            setSelPermGroupName(e.target.value);
        }}>
            {(showNoneEntry || loadingPermissionGroups) && <MenuItem value="None">None</MenuItem>}
            <PermissionCheck permissions={[Permissions.PERMISSIONS.EDIT]}><MenuItem value="Create"><AddIcon /> Create</MenuItem></PermissionCheck>
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

                        UsermgmtWebApi.editPermissionGroup(selectedPermissionGroup)
                            .then(() => updatePermissionGroups());
                    }}
                >Save</Button>
            </>}
        ></Snackbar>
    </BasePage>;
}
