import ExecutionContext from "../src/service/extensions/ExecutionContext";
import IExtension, { ExtensionMetadata } from "../src/service/extensions/IExtension";

export default class NullExtension implements IExtension {
    metadata: ExtensionMetadata;
    start: (executionContext: ExecutionContext) => Promise<void>;
    stop: () => Promise<void>;

    constructor(
        metadata: ExtensionMetadata,
        start?: (executionContext: ExecutionContext) => Promise<void>,
        stop?: () => Promise<void>,
    ) {
        this.metadata = metadata;
        this.start = start;
        this.stop = stop;
    }
}
