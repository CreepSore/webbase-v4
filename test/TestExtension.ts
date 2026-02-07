import ExecutionContext from "../src/service/extensions/ExecutionContext";
import IExtension, { ExtensionMetadata } from "../src/service/extensions/IExtension";

type TestExtensionOptions = {
    start?: IExtension["start"];
    stop?: IExtension["stop"];
};

export default class TestExtension implements IExtension {
    metadata: ExtensionMetadata = {
        name: "Test.Mock",
        description: "A test extension for unit testing purposes.",
        version: "1.0.0",
        dependencies: [],
    };

    start(executionContext: ExecutionContext): Promise<void> {
        return Promise.resolve();
    }

    stop(): Promise<void> {
        return Promise.resolve();
    }

    testInitialize(options: TestExtensionOptions): void {
        this.start = options.start || (() => Promise.resolve());
        this.stop = options.stop || (() => Promise.resolve());
    }
}
