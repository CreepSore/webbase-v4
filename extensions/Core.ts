import IExecutionContext from "@service/extensions/IExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import MainApplication from "@app/MainApplication";

export default class Testextension implements IExtension {
    metadata: ExtensionMetadata = {
        name: "Core",
        version: "1.0.0",
        description: "Core Module",
        author: "ehdes",
        dependencies: []
    };

    async start(executionContext: IExecutionContext) {
        let mainApp = executionContext.application as MainApplication;
        mainApp.onExpressStart(app => {
            app.get("/", (req, res) => {
                res.write("Works!");
                res.end();
            });
        });
    }

    async stop() {

    }
}
