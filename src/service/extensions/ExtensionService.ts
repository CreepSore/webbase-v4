import * as path from "path";
import * as fs from "fs";

import IExecutionContext, {IAppExecutionContext, ICliExecutionContext} from "./IExecutionContext";
import IExtension, {IExtensionConstructor} from "./IExtension";

export default class ExtensionService {
    extensions: Array<IExtension> = [];
    extensionsStarted: boolean = false;
    extensionPath: string;
    executionContext: IExecutionContext;

    constructor() {
        this.extensionPath = "./extensions/";
    }

    setContextInfo(info: IAppExecutionContext|ICliExecutionContext) {
        this.executionContext = info;
        this.executionContext.extensionService = this;
    }

    async loadExtensions() {
        if(this.extensionsStarted) return false;
        if(!fs.existsSync(this.extensionPath)) return false;
        let disabled = this.getDisabledExtensions();
        let extBaseDir = fs.readdirSync(this.extensionPath);

        this.extensions = (await Promise.all(
            extBaseDir
                .filter(name => !disabled.includes(name))
                .map(async extDir => {
                    if(extDir.startsWith("Custom.Template")) return null;

                    if(!fs.existsSync(path.join(this.extensionPath, extDir, "index.ts"))) return null;
                    if(this.getDisabledExtensions().includes(extDir)) return null;

                    const ImportedExtension: IExtensionConstructor = (await import("wpextensions/" + extDir + "/index.ts")).default;
                    const extension: IExtension = new ImportedExtension();
                    extension.metadata.extensionPath = path.resolve(this.extensionPath, extDir);
                    return extension;
                })
        )).filter(x => Boolean(x));

        this.extensions.forEach(extension => {
            extension.metadata.resolvedDependencies = this.extensions.filter(ext => extension.metadata.dependencies.includes(ext.metadata.name));
        });

        return true;
    }

    unloadExtensions() {
        this.stopExtensions();
        this.extensions = [];
    }

    async startExtensions() {
        if(this.extensionsStarted) return;
        let baseNodes = this.extensions.filter(ext => ext.metadata.dependencies.length === 0);

        for(let baseNode of baseNodes) {
            await this.startExtensionRecursive(baseNode);
        }

        this.extensionsStarted = true;
    }

    async stopExtensions() {
        if(!this.extensionsStarted) return;

        for(let extension of this.extensions) {
            await extension.stop();
        }

        this.extensionsStarted = false;
    }

    getExtension(name: string) {
        const result = this.extensions.find(ext => ext.metadata.name === name);
        if(!result) {
            console.log("WARN", "ExtensionService.ts", `Failed to get extension [${name}]`);
        }
        return result;
    }

    getExtensions(...names: string[]) {
        return this.extensions.filter(ext => names.includes(ext.metadata.name));
    }

    private async startExtensionRecursive(node: IExtension) {
        let runStart = false;
        if(!node.metadata.isLoaded) {
            node.metadata.isLoaded = true;
            runStart = true;
        }

        for(let dep of node.metadata.resolvedDependencies) {
            await this.startExtensionRecursive(dep);
        }

        if(runStart) {
            try {
                await node.start({...this.executionContext});
                console.log("INFO", "ExtensionService.ts", `Loaded Extension [${node.metadata.name}]@[${node.metadata.version}]`);
            }
            catch(err) {
                console.log("ERROR", "ExtensionService.ts", `Start of extension [${node.metadata.name}]@[${node.metadata.version}] failed: [${err.message}]: ${err.stack}`);
            }

            for(let child of this.extensions.filter(ext => ext.metadata.resolvedDependencies.includes(node))) {
                await this.startExtensionRecursive(child);
            }
        }
    }

    private getDisabledExtensions() {
        let disabledPath = path.join(this.extensionPath, "disabled.json");
        let disabledResult: string[] = [];
        if(!fs.existsSync(disabledPath)) {
            fs.writeFileSync(disabledPath, JSON.stringify(disabledResult, null, 4), "utf8");
        }
        else {
            disabledResult = JSON.parse(String(fs.readFileSync(disabledPath, "utf8")));
        }

        return disabledResult;
    }
}
