import * as uuid from "uuid";

export enum ActionState {
    PENDING = "PENDING",
    RUNNING = "RUNNING",
    SUCCESS = "SUCCESS",
    ERROR = "ERROR",
    ON_HOLD = "ON_HOLD",
}

export interface ActionMetadata {
    name?: string;
    description?: string;
}

export interface ActionOptions<ReturnType = void, ArgsType = void> {
    jobId?: string;
    metadata?: ActionMetadata;
    args?: ArgsType;
    callback?: (args: ArgsType) => ReturnType
}

export default class Action<ReturnType, ArgsType = void> {
    private _jobId: string;
    private _metadata: ActionMetadata;
    private _args: Partial<ArgsType>;
    private _result: ReturnType;
    private _error: Error;
    private _callback: (args: ArgsType) => ReturnType;
    private _state: ActionState = ActionState.PENDING;

    get jobId(): string {
        return this._jobId;
    }

    get metadata(): ActionMetadata {
        return this._metadata;
    }

    get result(): ReturnType {
        return this._result;
    }

    get error(): Error {
        return this._error;
    }

    get args(): ArgsType {
        return this._args as ArgsType;
    }

    constructor(options: ActionOptions<ReturnType, ArgsType>) {
        this._jobId = options.jobId || uuid.v4();
        this._metadata = options.metadata || {};
        this._args = options.args;
        this._callback = options.callback;
    }

    setArguments(args: ArgsType): this {
        this._args = args;
        return this;
    }

    setMetadata(metadata: ActionMetadata): this {
        this._metadata = metadata;
        return this;
    }

    setCallback(callback: (args: ArgsType) => ReturnType): this {
        this._callback = callback;
        return this;
    }

    setError(error: Error): this {
        this._error = error;
        return this;
    }

    setState(state: ActionState): this {
        this._state = state;
        return this;
    }

    execute(): ReturnType {
        this._result = undefined;
        this._error = undefined;

        const result = this._callback?.(this._args as ArgsType);
        this._result = result;
        return result;
    }
}
