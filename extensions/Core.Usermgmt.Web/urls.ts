const Urls = {
    base: "/api/v2",
    auth: {
        me: "/authentication/me",
        getAuthType: "/authentication/type/:username",
        getAuthTypes: "/authentication/types",
        login: "/authentication/login",
        logout: "/authentication/logout",
    },
    users: {
        get: "/users",
    },
    permissions: {
        getGroups: "/permissiongroups",
    },
} as const;

export default Urls;
