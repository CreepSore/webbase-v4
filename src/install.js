const fs = require("fs");
const path = require("path");
const child_process = require("child_process");
const minimist = require("minimist");

const argv = minimist(process.argv.slice(2), {
    string: ["npm", "extinit", "extdisable", "extenable"],
    boolean: ["run"],
});

const extensionsDirectoryPath = path.join(__dirname, "../extensions");
/** @type {{[key: string]: import("./install").default}} */
const extensions = {};

const main = async() => {
    const extensionsDirectoryFiles = fs.readdirSync(extensionsDirectoryPath);

    for(const extension of fs.readdirSync(extensionsDirectoryPath)) {
        if(extension.startsWith("Custom.Template")) {
            continue;
        }

        const extensionDir = path.join(extensionsDirectoryPath, extension);
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
        if(argv.npm === "lock") {
            lockNpmCommand();
            return;
        }

        generateNpmCommand();
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
        console.log("node install.js --npm=[install|remove|lock] [--run]");
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

 /** @return {Record<string, import("./install").ExtensionNpmDefinition>} */
const getNpmDefinitions = (ignoreTemplate = true) => {
    /** @type {Record<string, import("./install").ExtensionNpmDefinition>} */
    const npmDefinitions = {};

    for(const extension of fs.readdirSync(extensionsDirectoryPath)) {
        if(ignoreTemplate && extension.startsWith("Custom.Template")) {
            continue;
        }

        const extensionDir = path.join(extensionsDirectoryPath, extension);

        if(!fs.statSync(extensionDir).isDirectory()) {
            continue;
        }

        const npmDefinitionFile = path.join(extensionDir, "npm.json");
        if(!fs.existsSync(npmDefinitionFile)) {
            continue;
        }

        /** @type {import("./install").ExtensionNpmDefinition} */
        const parsedNpmDefinition = JSON.parse(fs.readFileSync(npmDefinitionFile, "utf-8"));
        npmDefinitions[extension] = parsedNpmDefinition;
    }

    return npmDefinitions;
}

const lockNpmCommand = () => {
    const packageJson = JSON.parse(fs.readFileSync("package-lock.json", "utf-8"));
    const {packages} = packageJson;
    /** @type {Record<string, string>} */
    const packageLockPackages = {};

    for(const packageKey in packages) {
        if(!packageKey.startsWith("node_modules/")) {
            continue;
        }

        const packageName = packageKey.substring(13);
        packageLockPackages[packageName] = packages[packageKey].version;
    }

    for(const extension of fs.readdirSync(extensionsDirectoryPath)) {
        const extensionDir = path.join(extensionsDirectoryPath, extension);
        if(extension.startsWith("Custom.Template")) {
            continue;
        }

        if(!fs.statSync(extensionDir).isDirectory()) {
            continue;
        }

        const npmDefinitionFile = path.join(extensionDir, "npm.json");
        if(!fs.existsSync(npmDefinitionFile)) {
            continue;
        }

        /** @type {import("./install").ExtensionNpmDefinition} */
        const parsedNpmDefinition = JSON.parse(fs.readFileSync(npmDefinitionFile, "utf-8"));
        let hasChanged = false;

        for(const definitionKey of Object.keys(parsedNpmDefinition.dependencies)) {
            if(packageLockPackages[definitionKey]) {
                parsedNpmDefinition.dependencies[definitionKey] = packageLockPackages[definitionKey];
                hasChanged = true;
            }
        }

        for(const devDefinitionKey of Object.keys(parsedNpmDefinition.devDependencies)) {
            if(packageLockPackages[devDefinitionKey]) {
                parsedNpmDefinition.devDependencies[devDefinitionKey] = packageLockPackages[devDefinitionKey];
                hasChanged = true;
            }
        }

        if(hasChanged) {
            fs.writeFileSync(npmDefinitionFile, JSON.stringify(parsedNpmDefinition, null, 4));
        }
    }
}

const generateNpmCommand = () => {
    const npmDefinitions = getNpmDefinitions(false);

    let result = "";
    let resultDev = "";
    let isRemoving = false;

    if(argv.npm === "install") {
        result = "npm install --save ";
        resultDev = "npm install --save-dev ";
    }
    else if(argv.npm === "remove") {
        result = "npm remove ";
        resultDev = "npm remove ";
        isRemoving = true;
    }
    else {
        return;
    }

    /** @param {string} pckge @param {string} version */
    const formatNpmDefinition = (pckge, version) => {
        if(isRemoving) {
            return pckge;
        }

        let v = version.trim();
        if(v === "*") {
            v = "";
        }
        else {
            v = `@${v}`;
        }

        return `${pckge}${v}`;
    }

    for(const extension in npmDefinitions) {
        const extensionConfig = npmDefinitions[extension];
        result += (Object.entries(extensionConfig.dependencies) || []).map(e => formatNpmDefinition(e[0], e[1])).join(" ") + " ";
        resultDev += (Object.entries(extensionConfig.devDependencies) || []).map(e => formatNpmDefinition(e[0], e[1])).join(" ") + " ";
    }

    console.log(result);
    console.log(resultDev);

    if(argv.run) {
        child_process.execSync(result, {stdio: "inherit"});
        child_process.execSync(resultDev, {stdio: "inherit"});
    }
}

main();
