import * as React from "react";
import BasePage from "./BasePage";
import useFetchApi from "@extensions/Core.React/hooks/useFetchApi";
import UsermgmtWebApi from "@extensions/Core.Usermgmt.Web/web/UsermgmtWebApi";
import Loader from "@extensions/Core.React/Loader/Loader";

import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";


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
                        UsermgmtWebApi.deleteUser(userToDelete)
                            .catch(() => {})
                            .then(() => {
                                updateUsers();
                                setUserToDelete(null);
                            });
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
                                    disabled={["Root", "Anonymous"].includes(u.username) || !me.hasPermission(Permissions.USERS.DELETE)}
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
                                        setOpenMenu(null);
                                        setEditDialogMode("edit");
                                        setEditDialogUser(u);
                                    }}>
                                        <ListItemIcon><SearchIcon /></ListItemIcon>
                                        <ListItemText>Edit</ListItemText>
                                    </MenuItem>
                                }

                                {me.hasPermission(Permissions.USERS.IMPERSONATE.name) &&
                                    <MenuItem onClick={() => {
                                        setOpenMenu(null);
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
