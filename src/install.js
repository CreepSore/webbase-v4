const fs = require("fs");
const path = require("path");
const child_process = require("child_process");
const minimist = require("minimist");

const argv = minimist(process.argv.slice(2), {
    string: ["npm", "extinit", "extdisable", "extenable"],
    boolean: ["run"],
});

/** @type {{[key: string]: import("./IInstallerType").default}} */
const extensions = {};

const main = async() => {
    const extPath = path.join(__dirname, "../extensions");
    const extensionsDir = fs.readdirSync(extPath);

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
    else if(argv.extinit) {
        initializeExtension(argv.extinit);
    }
    else if(argv.extdisable) {
        disableExtension(argv.extdisable);
    }
    else if(argv.extenable) {
        enableExtension(argv.extenable);
    }
    else {
        console.log("Commands:");
        console.log("node install.js --npm=[install|remove] [--run]");
        console.log("node install.js --extinit=[Extension.Name]");
        console.log("node install.js --extdisable=[Extension.Name]");
        console.log("node install.js --extenable=[Extension.Name]");
    }
};

const initializeExtension = (name) => {
    const normalizedName = name.replace(/\./g, "");
    const extPath = path.join(__dirname, "../extensions");
    const extensionDir = path.join(extPath, name);
    if(fs.existsSync(extensionDir)) {
        console.log("Extension already exists");
        return;
    }

    const templateDir = path.join(extPath, "Custom.Template");
    if(!fs.existsSync(templateDir)) {
        console.log("Template extension not found");
        return;
    }

    fs.mkdirSync(extensionDir);
    let indexData = fs.readFileSync(path.join(templateDir, "index.ts"), "utf8");
    indexData = indexData.replace(/Custom\.Template/g, name);
    indexData = indexData.replace(/CustomTemplate/g, normalizedName);
    fs.writeFileSync(path.join(extensionDir, "index.ts"), indexData);

    console.log("Extension created");
}

const disableExtension = (name) => {
    let disabledJson = path.resolve(__dirname, "..", "extensions", "disabled.json");
    let disabled;
    if(!fs.existsSync(disabledJson)) {
        disabled = [];
    }
    else {
        try {
            disabled = JSON.parse(fs.readFileSync(disabledJson, "utf8"));
        }
        catch(err) {
            console.error(err);
        }
    }

    let extDir = path.resolve(__dirname, "..", "extensions", name);
    if(!fs.existsSync(extDir)) {
        console.log("Extension not found");
        return;
    }

    let disabledFolder = path.resolve(__dirname, "..", "extensions", "disabled");
    if(!fs.existsSync(disabledFolder)) {
        fs.mkdirSync(disabledFolder);
    }

    fs.renameSync(extDir, path.resolve(disabledFolder, name));

    if(!disabled.includes(name)) {
        disabled.push(name);
        fs.writeFileSync(disabledJson, JSON.stringify(disabled, null, 4));
    }

    console.log("Extension disabled");
}

const enableExtension = (name) => {
    const disabledJson = path.resolve(__dirname, "..", "extensions", "disabled.json");
    let disabled;
    if(!fs.existsSync(disabledJson)) {
        disabled = [];
    }
    else {
        try {
            disabled = JSON.parse(fs.readFileSync(disabledJson, "utf8"));
        }
        catch(err) {
            console.error(err);
        }
    }

    const extDir = path.resolve(__dirname, "..", "extensions", "disabled", name);
    if(!fs.existsSync(extDir)) {
        console.log("Extension not found");
        return;
    }

    const enabledFolder = path.resolve(__dirname, "..", "extensions");
    fs.renameSync(extDir, path.resolve(enabledFolder, name));

    if(disabled.includes(name)) {
        disabled.splice(disabled.indexOf(name), 1);
        fs.writeFileSync(disabledJson, JSON.stringify(disabled, null, 4));
    }

    console.log("Extension enabled");
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
