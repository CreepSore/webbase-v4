/**
 * @return {import("../../src/IInstallerType").default}
 */
function installConfig() {
    return {
        npmDependencies: ["uuid"],
        npmDevDependencies: ["@types/uuid"],
    };
}

module.exports = installConfig;
