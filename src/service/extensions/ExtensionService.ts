import * as path from "path";
import * as fs from "fs";
import {EventEmitter} from "events";

import IExecutionContext, {IAppExecutionContext, ICliExecutionContext, ITestExecutionContext} from "./IExecutionContext";
import IExtension, {IExtensionConstructor} from "./IExtension";
import LogBuilder from "@service/logger/LogBuilder";

export default class ExtensionService {
    extensions: Array<IExtension> = [];
    extensionsStarted: boolean = false;
    extensionPath: string = "./extensions/";
    executionContext: IExecutionContext;
    emitter: EventEmitter = new EventEmitter();
    doSkipLogs: boolean = false;

    constructor() {}

    // #region Public Methods
    /**
     * Sets the current {@link IAppExecutionContext}
     * @param info
     */
    setContextInfo(info: IAppExecutionContext|ICliExecutionContext|ITestExecutionContext): void {
        this.executionContext = info;
        this.executionContext.extensionService = this;
    }

    async loadExtensionsFromExtensionsFolder(): Promise<boolean> {
        if(this.extensionsStarted) return false;
        if(!fs.existsSync(this.extensionPath)) return false;
        const disabled = this.getDisabledExtensions();
        const extBaseDir = fs.readdirSync(this.extensionPath);

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
                }),
        )).filter(x => Boolean(x));

        this.loadExtensions();

        return true;
    }

    unloadExtensions(): void {
        this.stopExtensions();
        this.extensions = [];
    }

    async startExtensions(): Promise<void> {
        if(this.extensionsStarted) return;
        const loaded: Set<IExtension> = new Set();
        let currentNodes = this.extensions.filter(ext => ext.metadata.dependencies.length === 0);

        while(currentNodes.length > 0) {
            for(const node of currentNodes) {
                loaded.add(node);
                try {
                    await node.start({...this.executionContext});
                    node.metadata.isLoaded = true;
                    this.fireOnExtensionStarted(node.metadata.name, {...this.executionContext});
                    if(!this.doSkipLogs) {
                        LogBuilder
                            .start()
                            .level("INFO")
                            .info("ExtensionService.ts")
                            .line(`Loaded Extension [${node.metadata.name}]@[${node.metadata.version}]`)
                            .done();
                    }
                }
                catch(err) {
                    LogBuilder
                        .start()
                        .level("ERROR")
                        .info("ExtensionService.ts")
                        .line(`Start of extension [${node.metadata.name}]@[${node.metadata.version}] failed`)
                        .object("error", err)
                        .done();
                }
            }
            currentNodes = this.extensions.filter(e =>
                !loaded.has(e) &&
                e.metadata.resolvedDependencies.length === e.metadata.dependencies.length &&
                !e.metadata.resolvedDependencies.some(d => !loaded.has(d)),
            );
        }

        this.extensionsStarted = true;
        this.fireAllExtensionsStarted({...this.executionContext});
    }

    async stopExtensions(): Promise<void> {
        if(!this.extensionsStarted) return;

        for(const extension of this.extensions) {
            await extension.stop();
        }

        this.extensionsStarted = false;
    }

    registerExtension(extension: IExtension): void {
        this.extensions.push(extension);
    }

    loadExtensions(): void {
        for(const extension of this.extensions) {
            extension.metadata.resolvedDependencies = this.extensions.filter(ext =>
                // ! I can not figure the types of this out under any circumstances
                // ! This works however, flawlessly
                // @ts-ignore
                extension.metadata.dependencies.includes(ext.metadata?.name) ||
                // @ts-ignore
                extension.metadata.dependencies.includes(ext.constructor)
            );
        }
    }

    /**
     * Gets an extension by its name
     * @param name the name of the extension
     */
    getExtension(name: string|Function & { prototype: IExtension }): IExtension {
        let result: IExtension;

        if(typeof name === "string") {
            result = this.extensions.find(ext => ext.metadata.name === name);
        }
        else if(name.prototype) {
            result = this.extensions.find(ext => ext instanceof name);
        }

        if(!result) {
            LogBuilder
                .start()
                .level("WARN")
                .info("ExtensionService.ts")
                .line(`Failed to get extension [${name}]`)
                .done();
        }

        return result || null;
    }

    /**
     * Gets multiple extensions by their names
     */
    getExtensions(...names: string[]): IExtension[] {
        return names.map(name => this.getExtension(name));
    }

    skipLogs(): void {
        this.doSkipLogs = true;
    }
    // #endregion

    // #region Events
    /**
     * Gets called after all extensions have been started
     */
    onAllExtensionsStarted(cb: (context: IExecutionContext) => void): void {
        this.emitter.on("all-extensions-started", cb);
    }

    private fireAllExtensionsStarted(context: IExecutionContext): void {
        this.emitter.emit("all-extensions-started", context);
    }

    /**
     * Gets called after the specified extension has been started
     */
    onExtensionStarted(extensionName: string, cb: (context: IExecutionContext) => void): void {
        this.emitter.on(`extension-started-${extensionName}`, cb);
    }

    private fireOnExtensionStarted(extensionName: string, context: IExecutionContext): void {
        this.emitter.emit(`extension-started-${extensionName}`, context);
    }
    // #endregion

    // #region Private Methods
    private getDisabledExtensions(): string[] {
        const disabledPath = path.join(this.extensionPath, "disabled.json");
        let disabledResult: string[] = [];
        if(!fs.existsSync(disabledPath)) {
            fs.writeFileSync(disabledPath, JSON.stringify(disabledResult, null, 4), "utf8");
        }
        else {
            disabledResult = JSON.parse(String(fs.readFileSync(disabledPath, "utf8")));
        }

        return disabledResult;
    }
    // #endregion
}
