import * as fs from "fs";
import * as path from "path";
import {EventEmitter} from "events";
import IApplication from "./IApplication";
import ExtensionService from "@service/extensions/ExtensionService";
import CommandHandler from "./CommandHandler";
import IExtension, { IExtensionConstructor } from "@service/extensions/IExtension";
import LoggerService from "../service/logger/LoggerService";
import LogBuilder from "../service/logger/LogBuilder";
import ConsoleLogger from "../service/logger/ConsoleLogger";


export default class TestApplication implements IApplication {
    events: EventEmitter = new EventEmitter();
    extensionService: ExtensionService = new ExtensionService();
    cmdHandler: CommandHandler = new CommandHandler();
    keepDependencies: string[];
    preload: (extension: IExtension) => Promise<void>;

    constructor(keepDependencies: string[], preload?: (extension: IExtension) => Promise<void>) {
        this.keepDependencies = keepDependencies;
        this.preload = preload;
    }

    async start(): Promise<void> {
        this.events = new EventEmitter();

        this.extensionService = await this.setupExtensionService();

        LoggerService.hookConsoleLog();

        console.log("INFO", "Test.ts", "Main Application Startup successful.");
    }

    async stop(): Promise<void> {
        await this.extensionService.stopExtensions();
    }

    private async setupExtensionService(): Promise<ExtensionService> {
        const extensionService: ExtensionService = new ExtensionService();

        for(const extDir of fs.readdirSync("extensions")) {
            if(extDir.startsWith("Custom.Template")) continue;

            if(!fs.existsSync(path.join("extensions", extDir, "index.ts"))) continue;

            const ImportedExtension: IExtensionConstructor = (await import(path.resolve("extensions", extDir, "index.ts"))).default;
            const extension: IExtension = new ImportedExtension();
            extension.metadata.extensionPath = path.resolve("extensions", extDir);
            extensionService.registerExtension(extension);
        }

        // @ts-ignore
        extensionService.setContextInfo({
            contextType: "test",
            application: this,
            extensionService: this.extensionService,
        });

        const toKeep = extensionService.getExtensions(...this.keepDependencies);
        await extensionService.loadExtensions();

        const addDependencies = (extension: IExtension): void => {
            for(const dependency of extension.metadata.resolvedDependencies) {
                if(!toKeep.includes(dependency)) {
                    toKeep.push(dependency);
                }
                addDependencies(dependency);
            }
        };

        for(const extension of toKeep) {
            addDependencies(extension);
        }

        extensionService.extensions = toKeep;

        if(this.preload) {
            for(const extension of extensionService.extensions) {
                await this.preload(extension);
            }
        }

        await extensionService.startExtensions();

        if(!LogBuilder.onDone) {
            LoggerService.hookConsoleLog();
        }

        LoggerService.loggers = [new ConsoleLogger(false)];

        return extensionService;
    }
}
