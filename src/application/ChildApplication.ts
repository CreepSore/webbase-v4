import * as uuid from "uuid";
import * as childProcess from "child_process";

import {EventEmitter} from "events";
import IApplication from "./IApplication";
import ConfigLoader from "@logic/config/ConfigLoader";
import ConfigModel from "@logic/config/ConfigModel";
import ExtensionService from "@service/extensions/ExtensionService";
import IExecutionContext from "@service/extensions/IExecutionContext";
import CommandHandler from "./CommandHandler";
import LogBuilder from "@service/logger/LogBuilder";

export default class ChildApplication implements IApplication {
    static currentExecutablePath: string;

    events: EventEmitter = new EventEmitter();
    extensionService: ExtensionService = new ExtensionService();
    cmdHandler: CommandHandler = new CommandHandler();

    id: string;
    childType: string;

    static childProcesses: {id: string, type: string, process: childProcess.ChildProcess}[] = [];

    constructor(childType: string) {
        this.childType = childType;
    }

    async start(): Promise<void> {
        const listenForId = (message: any): void => {
            if(message?.type === "CA_HANDSHAKE") {
                this.id = message?.id;

                LogBuilder
                    .start()
                    .level("INFO")
                    .info("ChildApplication.ts")
                    .line(`Got handshake from parent. Our id is [${this.id}]`)
                    .done();

                process.removeListener("message", listenForId);
            }
        };

        process.on?.("message", listenForId);
        process.send({type: "CA_HANDSHAKE"});

        this.events = new EventEmitter();
        const config = this.loadConfig();
        this.events.emit("config-loaded", config);

        this.extensionService.setContextInfo({
            contextType: "child-app",
            application: this,
            extensionService: this.extensionService,
            childType: this.childType,
        });
        await this.extensionService.loadExtensionsFromExtensionsFolder();
        await this.extensionService.startExtensions();

        console.log("INFO", "ChildApplication.ts", "Child Application Startup successful.");
        this.events.emit("after-startup", this.extensionService.executionContext);
    }

    async stop(): Promise<void> {
        await this.extensionService.stopExtensions();
    }

    loadConfig(): ConfigModel {
        const templateModel = new ConfigModel();
        const config = ConfigLoader.initConfigWithModel(
            ConfigLoader.createConfigPath("config.json"),
            ConfigLoader.createTemplateConfigPath("config.json"),
            templateModel,
            true,
        );

        if(!config && Object.keys(templateModel).length > 0) {
            // ! Throw Main-Application config error because factually, it is the main-application config.
            throw new Error("Main-Application Config does not exist");
        }
        return config;
    }

    onConfigLoaded(callback: (config: ConfigModel) => void): ChildApplication {
        this.events.on("config-loaded", callback);
        return this;
    }

    onAfterStartup(callback: (context: IExecutionContext) => void): ChildApplication {
        this.events.on("after-startup", callback);
        return this;
    }

    // TODO: Think of something better. This is actually fucking disgusting.
    static initializeStaticClass(currentExecutablePath: string): void {
        this.currentExecutablePath = currentExecutablePath;
    }

    static async startChildApplication(childAppType: string): Promise<string> {
        const forkedProcess = childProcess.fork(this.currentExecutablePath, [`--childApp=${childAppType}`], {
            detached: true,
            stdio: "ignore",
        });

        const processId = uuid.v4();

        LogBuilder
            .start()
            .level("INFO")
            .info("ChildApplication.ts")
            .line(`Child-Application of type ${childAppType} spawned with id ${processId} [${this.currentExecutablePath}].`)
            .done();

        const listenForHandshake = (message: any): void => {
            if(message.type === "CA_HANDSHAKE") {
                forkedProcess.send({type: "CA_HANDSHAKE", id: processId});
                forkedProcess.removeListener("message", listenForHandshake);
            }
        };
        forkedProcess.on("message", listenForHandshake);

        this.childProcesses.push({
            id: processId,
            type: childAppType,
            process: forkedProcess,
        });

        return processId;
    }

    static getChildProcessesByType(childAppType: string): childProcess.ChildProcess[] {
        return this.childProcesses
            .filter(processEntry => processEntry.type === childAppType)
            .map(processEntry => processEntry.process);
    }

    /**
     * This will return the first spawned instance of the provided childAppType if there is any.
     * @param {string} childAppType
     * @return {childProcess.ChildProcess}
     * @memberof ChildApplication
     */
    static getChildProcessByType(childAppType: string): childProcess.ChildProcess {
        return this.childProcesses.find(processEntry => processEntry.type === childAppType)?.process;
    }

    static getChildProcessById(id: string): childProcess.ChildProcess {
        return this.childProcesses.find(processEntry => processEntry.id === id)?.process;
    }
}
