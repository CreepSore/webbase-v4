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
    },
    USERS: {
        VIEW: {name: "users/view", description: "View users", isRoot: true, isAnonymous: false},
    },
} satisfies PermissionLayer;

export default Permissions;

export type {
    PermissionEntry,
    PermissionLayer,
};
