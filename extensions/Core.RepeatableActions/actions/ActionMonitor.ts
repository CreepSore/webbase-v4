import Action, { ActionState } from "./Action";

interface ActionErrorCallbackArgs {
    error: Error,
    action: Action<any, any>,
}

interface ActionEntry<ReturnType = void, ArgsType = void> {
    action: Action<ReturnType, ArgsType>;
    onSuccess?: (result: ReturnType) => void;
    onError?: (errArgs: ActionErrorCallbackArgs) => void;
}

export default class ActionMonitor {
    private _actions: ActionEntry<any, any>[] = [];

    add(
        action: Action<any, any>,
        onSuccess?: ActionEntry["onSuccess"],
        onError?: ActionEntry["onError"],
    ): boolean {
        this._actions = this._actions.filter(a => a.action.jobId !== action.jobId);

        this._actions.push({
            action,
            onSuccess,
            onError,
        });

        return true;
    }

    addAndExecute(
        action: Action<any, any>,
        onSuccess?: ActionEntry["onSuccess"],
        onError?: ActionEntry["onError"],
    ): void {
        this.add(action, onSuccess, onError);
        this.executeAction(action);
    }

    getActionFromId<ReturnType, ArgsType>(jobId: string): Action<ReturnType, ArgsType> {
        return this.getActionEntryFromId<ReturnType, ArgsType>(jobId)?.action;
    }

    getActionEntryFromId<ReturnType, ArgsType>(jobId: string): ActionEntry<ReturnType, ArgsType> {
        return this._actions.find(a => a.action.jobId === jobId);
    }

    tryRunAction(jobId: string): void {
        const action = this.getActionFromId(jobId);
        if (action) {
            this.executeAction(action);
        }
    }

    private async executeAction<T, T2>(action: Action<T, T2>, args: T2 = undefined): Promise<T> {
        const entry = this.getActionEntryFromId<T, T2>(action.jobId);
        action.setState(ActionState.RUNNING);
        action.setArguments(args ?? action.args);

        try {
            const result = await action.execute();
            action.setState(ActionState.SUCCESS);
            entry?.onSuccess?.(result);
            return result;
        }
        catch(err) {
            action.setState(ActionState.ERROR);
            action.setError(err);
            entry?.onError?.({
                error: err,
                action,
            });
        }
    }
}

