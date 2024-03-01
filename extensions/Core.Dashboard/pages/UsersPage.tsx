import * as React from "react";
import BasePage from "./BasePage";
import useFetchApi from "@extensions/Core.React/hooks/useFetchApi";
import UsermgmtWebApi from "@extensions/Core.Usermgmt.Web/web/UsermgmtWebApi";
import Loader from "@extensions/Core.React/Loader/Loader";
import { Button, ButtonGroup, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Paper, Popper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import IUser from "@extensions/Core.Usermgmt/types/IUser";
import AddIcon from "@mui/icons-material/Add";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Search as SearchIcon } from "@mui/icons-material";
import MeContext from "@extensions/Core.Usermgmt.Web/web/components/me-provider/MeContext";
import Permissions from "@extensions/Core.Usermgmt/permissions";
import EditUserDialog from "../components/dialogs/EditUserDialogs";
import PermissionCheck from "@extensions/Core.Usermgmt.Web/web/components/PermissionCheck";

export default function UsersPage(): JSX.Element {
    const me = React.useContext(MeContext);
    const [rowRefs, setRowRefs] = React.useState<Map<IUser, HTMLElement>>(new Map());
    const [users, usersLoading, updateUsers] = useFetchApi(() => UsermgmtWebApi.getUsers(), [], () => setRowRefs(new Map()));
    const [userToDelete, setUserToDelete] = React.useState<IUser>(null);
    const [editDialogMode, setEditDialogMode] = React.useState<"edit"|"create">(null);
    const [editDialogUser, setEditDialogUser] = React.useState<IUser>(null);
    const [openPopper, setOpenMenu] = React.useState<IUser>(null);
    const isLoading = React.useMemo(() => usersLoading, [usersLoading]);

    const addRef = (user: IUser, ref: HTMLElement): void => {
        rowRefs.set(user, ref);
        setRowRefs(rowRefs);
    };

    return isLoading ? <Loader /> : <BasePage>
        {/* DELETE DIALOG */}
        {Boolean(userToDelete) && <Dialog open fullWidth>
            <DialogTitle>Delete User</DialogTitle>
            <DialogContent>
                <DialogContentText>Are you sure that you want to delete the user {userToDelete.username} ?</DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button
                    color="success"
                    variant="outlined"
                    onClick={() => {
                        setUserToDelete(null);
                        updateUsers();
                    }}
                    size="small"
                >OK</Button>

                <Button
                    variant="outlined"
                    onClick={() => setUserToDelete(null)}
                    size="small"
                >Cancel</Button>
            </DialogActions>
        </Dialog>}

        {/* CREATE DIALOG */}
        {editDialogMode && <EditUserDialog
            type={editDialogMode}
            user={editDialogUser}
            onClose={() => {
                setEditDialogMode(null);
                setEditDialogUser(null);
                updateUsers();
            }}
        />}

        {/* CONTENT */}
        <Table size="small">
            <TableHead>
                <TableRow>
                    <TableCell>Username</TableCell>
                    <TableCell>Auth-Methods</TableCell>
                    <TableCell align="right">
                        <PermissionCheck permissions={[Permissions.USERS.EDIT]}>
                            <IconButton
                                color="success"
                                onClick={() => setEditDialogMode("create")}
                            ><AddIcon /></IconButton>
                        </PermissionCheck>
                    </TableCell>
                </TableRow>
            </TableHead>

            <TableBody>
                {(users || []).map((u, i) => <TableRow key={u.username}>
                    <TableCell>{u.username}</TableCell>
                    <TableCell>{(u.authentication || []).map(a => a.type).join(", ")}</TableCell>
                    <TableCell align="right">
                        <PermissionCheck permissions={[[Permissions.USERS.EDIT], [Permissions.USERS.IMPERSONATE]]}>
                            <ButtonGroup>
                                <Button
                                    color="error"
                                    variant="outlined"
                                    disabled={["Root", "Anonymous"].includes(u.username)}
                                    onClick={() => setUserToDelete(u)}
                                    size="small"
                                ><DeleteForeverIcon/> Delete</Button>
                                <Button onClick={() => setOpenMenu(u)} ref={ref => addRef(u, ref)}><ExpandMoreIcon /></Button>
                            </ButtonGroup>

                            <Menu
                                open={openPopper === u}
                                anchorEl={rowRefs.get(u)}
                                onClose={() => setOpenMenu(null)}
                            >
                                {me.hasPermission(Permissions.USERS.EDIT.name) &&
                                    <MenuItem onClick={() => {
                                        setEditDialogMode("edit");
                                        setEditDialogUser(u);
                                    }}>
                                        <ListItemIcon><SearchIcon /></ListItemIcon>
                                        <ListItemText>Edit</ListItemText>
                                    </MenuItem>
                                }

                                {me.hasPermission(Permissions.USERS.IMPERSONATE.name) &&
                                    <MenuItem onClick={() => {
                                        UsermgmtWebApi.impersonateUser(u).catch(() => {}).then(() => {location.reload();});
                                    }}>
                                        <ListItemText>Impersonate</ListItemText>
                                    </MenuItem>
                                }
                            </Menu>
                        </PermissionCheck>
                    </TableCell>
                </TableRow>)}
            </TableBody>
        </Table>
    </BasePage>;
}
