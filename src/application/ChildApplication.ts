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
import LoggerService from "@service/logger/LoggerService";
import FileLogger from "@service/logger/FileLogger";
import ChildConsoleLogger from "@service/logger/ChildConsoleLogger";

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

                this.extensionService.setContextInfo({
                    contextType: "child-app",
                    application: this,
                    extensionService: this.extensionService,
                    childType: this.childType,
                });

                this.extensionService.skipLogs();

                this.extensionService
                    .loadExtensionsFromExtensionsFolder()
                    .then(() => {
                        this.extensionService
                            .startExtensions()
                            .then(() => {
                                console.log("INFO", "ChildApplication.ts", "Child Application Startup successful.");
                                console.log("INFO", "ChildApplication.ts", `Got handshake from parent. Our id is [${this.id}]`);

                                this.events.emit("after-startup", this.extensionService.executionContext);
                            });
                    });

                process.removeListener("message", listenForId);
            }
        };

        LoggerService
            .addLogger(new ChildConsoleLogger(this, true))
            .addLogger(new FileLogger(`logs/out_child_${this.childType}_${new Date().toISOString().replace(/(\d+)-(\d+)-(\d+)T(\d+):(\d+):(\d+).(\d+)Z/, "$1_$2_$3_$4_$5")}.log`))
            .hookConsoleLog();

        process.on?.("message", listenForId);
        process.send({type: "CA_HANDSHAKE"});

        this.events = new EventEmitter();
        const config = this.loadConfig();
        this.events.emit("config-loaded", config);
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

    static startChildApplication(
        childAppType: string,
        rejectAfterMs: number = 10000,
        attachStdio: childProcess.StdioOptions = "ignore",
    ): Promise<string> {
        return new Promise((res, rej) => {
            let rejectionTimeout: NodeJS.Timeout = null;
            if(rejectAfterMs > 0) {
                rejectionTimeout = setTimeout(() => {
                    rej("TIMEOUT");
                }, rejectAfterMs);
            }

            const forkedProcess = childProcess.fork(this.currentExecutablePath, [`--childApp=${childAppType}`], {
                detached: true,
                stdio: attachStdio,
            });

            const processId = uuid.v4();

            const listenForHandshake = (message: any): void => {
                if(message.type === "CA_HANDSHAKE") {
                    if(rejectionTimeout) {
                        clearTimeout(rejectionTimeout);
                    }

                    res(processId);

                    forkedProcess.send({type: "CA_HANDSHAKE", id: processId});
                    forkedProcess.removeListener("message", listenForHandshake);
                }
            };
            forkedProcess.on("message", listenForHandshake);

            forkedProcess.once("exit", code => {
                LogBuilder
                    .start()
                    .level("INFO")
                    .info("ChildApplication.ts", childAppType, processId, String(code))
                    .line("Child Application exited.")
                    .done();
            });

            this.childProcesses.push({
                id: processId,
                type: childAppType,
                process: forkedProcess,
            });

            return processId;
        });
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