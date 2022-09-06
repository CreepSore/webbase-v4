import IExecutionContext from "@service/extensions/IExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import MainApplication from "@app/MainApplication";
import ConfigModel from "@logic/config/ConfigModel";

export default class Core implements IExtension {
    metadata: ExtensionMetadata = {
        name: "Core",
        version: "1.0.0",
        description: "Core Module",
        author: "ehdes",
        dependencies: []
    };

    mainConfig: ConfigModel;

    async start(executionContext: IExecutionContext) {
        if(executionContext.contextType === "cli") return;

        let mainApp = executionContext.application as MainApplication;

        mainApp
        .onConfigLoaded(config => {
            this.mainConfig = config;
        })
        .onExpressStart(app => {
            app.get("/", (req, res) => {
                res.write("Works!");
                res.end();
            });
        });
    }

    async stop() {

    }
}
