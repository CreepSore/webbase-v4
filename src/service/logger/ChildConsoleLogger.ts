import ChildApplication from "@app/ChildApplication";
import ConsoleLogger from "./ConsoleLogger";
import ILogEntry from "./ILogEntry";

export default class ChildConsoleLogger extends ConsoleLogger {
    app: ChildApplication;

    constructor(childApp: ChildApplication, prettyPrint: boolean = false) {
        super(prettyPrint);
        this.app = childApp;
    }

    log(log: ILogEntry): Promise<void> {
        const clonedEntry: ILogEntry = {
            ...log,
            lines: [...log.lines],
            infos: [...log.infos],
            objects: {...log.objects},
        };

        clonedEntry.infos.push(this.app.childType, this.app.id);
        return super.log(clonedEntry);
    }
}
