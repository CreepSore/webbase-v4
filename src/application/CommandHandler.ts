import minimist from "minimist";


export type ICommandCallbackResult = void | "INVALID_USAGE" | "INVALID_COMMAND" | "ERROR_HANDLED_BY_COMMAND";

export interface ICommandExecutionResult {
    result: ICommandCallbackResult;
    log: string[];
}

export interface ICommand {
    triggers: string[];
    description?: string;
    examples?: string[];
    parameters?: {
        name: string;
        aliases?: string[];
        description?: string;
    }[];
    callback: (args: minimist.ParsedArgs, log: (msg: string) => void) => Promise<ICommandCallbackResult> | ICommandCallbackResult;
}

export default class CommandHandler {
    commands: Set<ICommand> = new Set();
    isInteractive: boolean = false;

    async triggerString(cmd: string): Promise<ICommandExecutionResult> {
        const parsed = minimist(cmd.split(" "));
        parsed.c = parsed.command = parsed._[0];
        return await this.triggerArgs(parsed);
    }

    async triggerArgs(args: minimist.ParsedArgs): Promise<ICommandExecutionResult> {
        const command = this.getCommand(args.c);
        const log: string[] = [];
        if(!command) {
            return {
                result: "INVALID_COMMAND",
                log,
            };
        }

        return {
            result: await command.callback(args, (message) => {
                log.push(message);
            }),
            log,
        };
    }

    getHelpString(command: ICommand): string {
        const example = command.examples ? `  Examples:\n${command.examples.map(x => `    ${x}`).join("\n")}\n` : "";
        const parameters = (command.parameters || [])
            .map(p => `    ${p.name}${p.aliases ? `, ${p.aliases.join(", ")}` : ""} ${p.description ? `: ${p.description}` : ""}`)
            .join("\n");

        return `[${command.triggers.join(", ")}]${command.description ? `: ${command.description}` : ""}
${parameters.length > 0 ? `  Parameters:\n${parameters}\n` : ""}${example}`;
    }

    getHelpPage(): string {
        return [...this.commands]
            .map(c => this.getHelpString(c))
            .join("\n\n");
    }

    getCommand(trigger: string): ICommand | null {
        return [...this.commands].find(cmd => cmd.triggers.includes(trigger));
    }

    registerCommand(command: ICommand): this {
        this.commands.add(command);
        return this;
    }
}
