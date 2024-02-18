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
} satisfies PermissionLayer;

export default Permissions;

export type {
    PermissionEntry,
    PermissionLayer,
};
