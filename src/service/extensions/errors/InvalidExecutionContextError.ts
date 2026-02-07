import ExecutionContext from "../ExecutionContext";

export default class InvalidExecutionContextError extends Error {
    constructor(executionContext?: ExecutionContext) {
        super(`Invalid execution-context provided: [${executionContext}]`);
    }
}
