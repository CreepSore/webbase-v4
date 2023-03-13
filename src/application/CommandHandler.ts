import minimist from "minimist";

type ICommandCallbackResult = void | "INVALID_USAGE" | "INVALID_COMMAND" | "ERROR_HANDLED_BY_COMMAND";

interface ICommand {
    triggers: string[];
    description?: string;
    examples?: string[];
    parameters?: {
        name: string;
        aliases?: string[];
        description?: string;
    }[];
    callback: (args: minimist.ParsedArgs) => Promise<ICommandCallbackResult> | ICommandCallbackResult;
}

export default class CommandHandler {
    commands: Set<ICommand> = new Set();

    async triggerString(cmd: string): Promise<ICommandCallbackResult> {
        const parsed = minimist(cmd.split(" "));
        parsed.c = parsed.command = parsed._[0];
        return await this.triggerArgs(parsed);
    }

    async triggerArgs(args: minimist.ParsedArgs): Promise<ICommandCallbackResult> {
        const command = this.getCommand(args.c);
        if(!command) {
            return "INVALID_COMMAND";
        }

        return await command.callback(args);
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
