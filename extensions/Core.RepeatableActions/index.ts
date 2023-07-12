import {EventEmitter} from "events";

import IExecutionContext, { IAppExecutionContext, ICliExecutionContext } from "@service/extensions/IExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import ConfigLoader from "@logic/config/ConfigLoader";
import ActionMonitor from "./actions/ActionMonitor";
import { ActionState } from "./actions/Action";
import Core from "@extensions/Core";

class CoreRepeatableActionsConfig {

}

export default class CoreRepeatableActions implements IExtension {
    static metadata: ExtensionMetadata = {
        name: "Core.RepeatableActions",
        version: "1.0.0",
        description: "Provides an interface for managing repeatable actions",
        author: "ehdes",
        dependencies: [Core.metadata.name],
    };

    metadata: ExtensionMetadata = CoreRepeatableActions.metadata;

    config: CoreRepeatableActionsConfig;
    events: EventEmitter = new EventEmitter();
    monitor: ActionMonitor = new ActionMonitor();

    constructor() {
        this.config = this.loadConfig(true);
    }

    async start(executionContext: IExecutionContext): Promise<void> {
        this.checkConfig();
        if(executionContext.contextType === "cli") {
            await this.startCli(executionContext);
            return;
        }
        else if(executionContext.contextType === "app") {
            await this.startMain(executionContext);
            return;
        }
    }

    async stop(): Promise<void> {

    }

    private async startCli(executionContext: ICliExecutionContext): Promise<void> {

    }

    private async startMain(executionContext: IAppExecutionContext): Promise<void> {
        executionContext.application.cmdHandler.registerCommand({
            triggers: ["actions"],
            callback: async(args, log) => {
                if(args.restart) {
                    const action = this.monitor.actions.find(a => a.jobId === args.restart);
                    if(!action) {
                        log("Invalid Action");
                        return;
                    }

                    if(action.state !== ActionState.ERROR && !args.force) {
                        log("Action is not in an error state. Use --force to force restart");
                        return;
                    }

                    let parsed: any;
                    // ! This is insane. I'm sorry.
                    if(args._.length > 1) {
                        try {
                            parsed = JSON.parse(args._.slice(1).join(" "));
                        }
                        catch {
                            log("Invalid JSON");
                            return;
                        }
                    }

                    this.monitor.tryRunAction(action.jobId, parsed);
                    log("Kicked off action");
                    return;
                }

                if(args.show) {
                    const action = this.monitor.actions.find(a => a.jobId === args.show);
                    if(!action) {
                        log("Invalid Action");
                        return;
                    }

                    log(`Action [${action.jobId}]:`);
                    log(`State: ${action.state}`);
                    log(`Args: ${JSON.stringify(action.args)}`);
                    log(`Last Error: ${String(action.error)}`);
                    log(`Last Result: ${action.result}`);
                    return;
                }

                const lines = [
                    ["Id", "State"],
                    ...this.monitor.actions.map(action => [action.jobId, String(action.state)]),
                ];

                const colSize = lines.reduce((acc, cur) => {
                    return Math.max(acc, cur[0].length, cur[1].length);
                }, 0) + 2;

                log(`Actions (${this.monitor.actions.length}):`);
                log(lines.map(line => {
                    return line.map((col, i) => {
                        return col.padEnd(colSize + (i === 0 ? 0 : 2));
                    },
                    ).join("");
                }).join("\n"));
            },
        });
    }

    private checkConfig(): void {
        if(!this.config) {
            throw new Error(`Config could not be found at [${this.generateConfigNames()[0]}]`);
        }
    }

    private loadConfig(createDefault: boolean = false): typeof this.config {
        const [configPath, templatePath] = this.generateConfigNames();
        return ConfigLoader.initConfigWithModel(
            configPath,
            templatePath,
            new CoreRepeatableActionsConfig(),
            createDefault,
        );
    }

    private generateConfigNames(): string[] {
        return [
            ConfigLoader.createConfigPath(`${this.metadata.name}.json`),
            ConfigLoader.createTemplateConfigPath(`${this.metadata.name}.json`),
        ];
    }
}
