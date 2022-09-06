import * as path from "path";
import * as fs from "fs";

import IExecutionContext from "./IExecutionContext";
import IExtension, {IExtensionConstructor} from "./IExtension";

export default class ExtensionService {
    extensions: Array<IExtension> = [];
    extensionsStarted: boolean = false;
    extensionPath: string;
    executionContext: IExecutionContext;

    constructor() {
        this.extensionPath = "./extensions/";
    }

    setContextInfo(info: IExecutionContext) {
        this.executionContext = info;
        this.executionContext.extensionService = this;
    }

    async loadExtensions() {
        if(this.extensionsStarted) return false;
        if(!fs.existsSync(this.extensionPath)) return false;
        let extDir = fs.readdirSync(this.extensionPath);

        this.extensions = (await Promise.all(extDir.map(async filename => {
            if(!filename.endsWith(".js") && !filename.endsWith(".ts")) return null;
            const finalPath = path.join(this.extensionPath, filename);
            let stat = fs.statSync(finalPath);

            if(!stat.isFile()) return null;

            const ImportedExtension: IExtensionConstructor = (await import("wpextensions/" + filename)).default;

            const extension: IExtension = new ImportedExtension();
            return extension;
        }))).filter(x => Boolean(x));

        this.extensions.forEach(extension => {
            extension.metadata.resolvedDependencies = this.extensions.filter(ext => extension.metadata.dependencies.includes(ext.metadata.name));
        });

        return true;
    }

    unloadExtensions() {
        this.stopExtensions();
        this.extensions = [];
    }

    startExtensions() {
        if(this.extensionsStarted) return;
        let baseNodes = this.extensions.filter(ext => ext.metadata.dependencies.length === 0);

        baseNodes.forEach(baseNode => {
            this.startExtensionRecursive(baseNode);
        });

        this.extensionsStarted = true;
    }

    stopExtensions() {
        if(!this.extensionsStarted) return;

        this.extensionsStarted = false;
    }

    getExtension(name: string) {
        return this.extensions.find(ext => ext.metadata.name === name);
    }

    getExtensions(names: string[]) {
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
                console.log("[INFO]", `Loaded Extension [${node.metadata.name}]@[${node.metadata.version}]`)
            }
            catch(err) {
                console.log("[ERROR]", `Start of extension [${node.metadata.name}]@[${node.metadata.version}] failed: [${err.message}]: ${err.stack}`);
            }

            for(let child of this.extensions.filter(ext => ext.metadata.resolvedDependencies.includes(node))) {
                await this.startExtensionRecursive(child);
            }
        }
    }
}
