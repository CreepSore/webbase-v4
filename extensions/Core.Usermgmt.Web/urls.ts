const Urls = {
    base: "/api/v2",
    auth: {
        me: "/authentication/me", // GET
        getAuthType: "/authentication/type/:username", // GET
        getAuthTypes: "/authentication/types", // GET
        login: "/authentication/login", // POST
        logout: "/authentication/logout", // GET
    },
    users: {
        get: "/users", // GET
        create: "/user", // PUT
        edit: "/user/:name", // POST
        "delete": "/user/:name", // DELETE
        impersonate: "/user/:name/impersonate", // POST
    },
    permissions: {
        get: "/permissions",
        groups: {
            get: "/permissiongroups", // GET
            create: "/permissiongroup", // PUT
            edit: "/permissiongroup/:name", // POST
        },
    },
} as const;

export default Urls;
