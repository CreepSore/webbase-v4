type PermissionEntry = {
    name: string,
    description: string,
    isAnonymous: boolean,
    isRoot: boolean,
};

type PermissionLayer = {
    [key: string]: PermissionLayer|PermissionEntry
};

const Permissions = {
    ALL: {name: "*", description: "*", isRoot: true, isAnonymous: false},
    AUTH: {
        LOGIN: {name: "auth/login", description: "Allow login", isRoot: true, isAnonymous: true},
        VIEW_TYPES: {name: "auth/types/view", description: "Allows fetching of authentication types", isRoot: true, isAnonymous: false},
    },
    USERS: {
        VIEW: {name: "users/view", description: "View users", isRoot: true, isAnonymous: false},
    },
    PERMISSIONS: {
        VIEW: {name: "permissions/view", description: "View all permissions and permission groups", isRoot: true, isAnonymous: false},
    },
} satisfies PermissionLayer;

export default Permissions;

export type {
    PermissionEntry,
    PermissionLayer,
};
