const fs = require("fs");
const path = require("path");
const child_process = require("child_process");
const minimist = require("minimist");

const argv = minimist(process.argv.slice(2), {
    string: ["npm"],
    boolean: ["run"],
});

const main = async() => {
    const extPath = path.join(__dirname, "../extensions");
    const extensionsDir = fs.readdirSync(extPath);
    /** @type {{[key: string]: import("./IInstallerType").default}} */
    const extensions = {};

    for(const extension of extensionsDir) {
        if(extension.startsWith("Custom.Template")) {
            continue;
        }

        const extensionDir = path.join(extPath, extension);
        if(!fs.statSync(extensionDir).isDirectory()) {
            continue;
        }

        const installFile = path.join(extensionDir, "install.js");
        if(!fs.existsSync(installFile)) {
            continue;
        }

        const installConfig = require(installFile);
        extensions[extension] = installConfig();
    }

    if(argv.npm) {
        generateNpmCommand(extensions);
    }
    else {
        console.log("Commands:");
        console.log("node install.js --npm=[install|remove] [--run]");
    }
};

/**
 * @param {{[key: string]: import("./IInstallerType").default}} extensions
 */
const generateNpmCommand = (extensions) => {
    let result = "";
    let resultDev = "";

    if(argv.npm === "install") {
        result = "npm install --save ";
        resultDev = "npm install --save-dev ";
    }
    else if(argv.npm === "remove") {
        result = "npm remove ";
        resultDev = "npm remove ";
    }
    else {
        return;
    }

    for(const extension in extensions) {
        const extensionConfig = extensions[extension];
        result += (extensionConfig.npmDependencies || []).join(" ") + " ";
        resultDev += (extensionConfig.npmDevDependencies || []).join(" ") + " ";
    }

    if(argv.run) {
        child_process.execSync(result, {stdio: "inherit"});
        child_process.execSync(resultDev, {stdio: "inherit"});
    }
    else {
        console.log(result);
        console.log(resultDev);
    }
}

main();
