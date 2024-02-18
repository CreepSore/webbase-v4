const Urls = {
    base: "/api/v2",
    auth: {
        me: "/authentication/me",
        getAuthType: "/authentication/type/:username",
        login: "/authentication/login",
    },
} as const;

export default Urls;
