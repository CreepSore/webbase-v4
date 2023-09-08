import * as fs from "fs";
import * as path from "path";
import {EventEmitter} from "events";
import IApplication from "./IApplication";
import ExtensionService from "@service/extensions/ExtensionService";
import CommandHandler from "./CommandHandler";
import IExtension, { IExtensionConstructor } from "@service/extensions/IExtension";


export default class TestApplication implements IApplication {
    events: EventEmitter = new EventEmitter();
    extensionService: ExtensionService = new ExtensionService();
    cmdHandler: CommandHandler = new CommandHandler();
    keepDependencies: string[];

    constructor(keepDependencies: string[]) {
        this.keepDependencies = keepDependencies;
    }

    async start(): Promise<void> {
        this.events = new EventEmitter();

        this.extensionService = await this.setupExtensionService();

        this.extensionService.setContextInfo({
            contextType: "test",
            application: this,
            extensionService: this.extensionService,
        });

        await this.extensionService.loadExtensionsFromExtensionsFolder();
        await this.extensionService.startExtensions();

        console.log("INFO", "Test.ts", "Main Application Startup successful.");
    }

    async stop(): Promise<void> {
        await this.extensionService.stopExtensions();
    }

    private async setupExtensionService(): Promise<ExtensionService> {
        let extensionService: ExtensionService = new ExtensionService();

        for(const extDir of fs.readdirSync("extensions")) {
            if(extDir.startsWith("Custom.Template")) continue;

            if(!fs.existsSync(path.join("extensions", extDir, "index.ts"))) continue;

            const ImportedExtension: IExtensionConstructor = (await import(path.resolve("extensions", extDir, "index.ts"))).default;
            const extension: IExtension = new ImportedExtension();
            extension.metadata.extensionPath = path.resolve("extensions", extDir);
            extensionService.registerExtension(extension);
        }

        extensionService.loadExtensions();

        let toKeep = extensionService.getExtensions(...this.keepDependencies);

        let addDependencies = (extension: IExtension) => {
            for(const dependency of extension.metadata.resolvedDependencies) {
                toKeep.push(dependency);
                addDependencies(dependency);
            }
        };

        for(const extension of toKeep) {
            addDependencies(extension);
        }

        extensionService.extensions = toKeep;
        await extensionService.startExtensions();

        return extensionService;
    }
}
