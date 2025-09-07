import minimist from "minimist";
import ExtensionService from "../service/extensions/ExtensionService";
import IApplication from "./IApplication";
import DeploymentRegistry from "../service/deployment/DeploymentRegistry";
import LogBuilder from "../service/logger/LogBuilder";

export default class DeploymentApplication implements IApplication {
    private isStarted: boolean;
    private args: minimist.ParsedArgs;

    extensionService: ExtensionService = new ExtensionService();
    deploymentRegistry: DeploymentRegistry = new DeploymentRegistry();

    constructor(args: minimist.ParsedArgs) {
        this.args = args;
    }

    async start(): Promise<void> {
        if(this.isStarted) {
            return;
        }

        this.isStarted = true;

        if(!this.args.deploy || typeof this.args.deploy !== "string") {
            throw new Error("No --deploy parameter specified!");
        }

        this.extensionService.setContextInfo({
            contextType: "deployment",
            application: this,
            extensionService: this.extensionService,
        });

        await this.extensionService.loadExtensionsFromExtensionsFolder();
        await this.extensionService.startExtensions();

        await LogBuilder
            .start()
            .level(LogBuilder.LogLevel.INFO)
            .info("DeploymentApplication")
            .line(`Starting deployment of type [${this.args.deploy}]`)
            .done();

        try {
            await this.deploymentRegistry.deploy(this.args.deploy, this.args);

            await LogBuilder
                .start()
                .level(LogBuilder.LogLevel.INFO)
                .info("DeploymentApplication")
                .line(`Deployment of type [${this.args.deploy}] finished successfully`)
                .done();

        }
        catch(e) {
            await LogBuilder
                .start()
                .level(LogBuilder.LogLevel.INFO)
                .info("DeploymentApplication")
                .line(`Deployment of type [${this.args.deploy}] finished with error`)
                .done();


            throw e;
        }
    }

    async stop(): Promise<void> {
        if(!this.isStarted) {
            return;
        }

        this.isStarted = false;
    }
}
