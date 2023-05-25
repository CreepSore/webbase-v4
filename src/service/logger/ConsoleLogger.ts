import util from "util";

import ILogEntry from "./ILogEntry";
import ILogger from "./ILogger";
import LoggerService from "./LoggerService";

const linuxTerminalColors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    underscore: "\x1b[4m",
    blink: "\x1b[5m",
    reverse: "\x1b[7m",
    hidden: "\x1b[8m",
    fgblack: "\x1b[30m",
    fgred: "\x1b[31m",
    fggreen: "\x1b[32m",
    fgyellow: "\x1b[33m",
    fgblue: "\x1b[34m",
    fgmagenta: "\x1b[35m",
    fgcyan: "\x1b[36m",
    fgwhite: "\x1b[37m",
    bgblack: "\x1b[40m",
    bgred: "\x1b[41m",
    bggreen: "\x1b[42m",
    bgyellow: "\x1b[43m",
    bgblue: "\x1b[44m",
    bgmagenta: "\x1b[45m",
    bgcyan: "\x1b[46m",
    bgwhite: "\x1b[47m",
};

const logLevelMapping: {[key: string]: {date: string, text: string}} = {
    NOTE: {date: `${linuxTerminalColors.bgblack}${linuxTerminalColors.fgwhite}`, text: `${linuxTerminalColors.reset}${linuxTerminalColors.fgwhite}`},
    INFO: {date: `${linuxTerminalColors.bgblue}${linuxTerminalColors.fgwhite}`, text: `${linuxTerminalColors.reset}${linuxTerminalColors.fgblue}`},
    WEBINFO: {date: `${linuxTerminalColors.bgblue}${linuxTerminalColors.fgwhite}`, text: `${linuxTerminalColors.reset}${linuxTerminalColors.fgblue}`},
    ERROR: {date: `${linuxTerminalColors.bgred}${linuxTerminalColors.fgwhite}`, text: `${linuxTerminalColors.reset}${linuxTerminalColors.fgred}`},
    WARN: {date: `${linuxTerminalColors.bgyellow}${linuxTerminalColors.fgblack}`, text: `${linuxTerminalColors.reset}${linuxTerminalColors.fgyellow}`},
    CRITICAL: {date: `${linuxTerminalColors.bgred}${linuxTerminalColors.fgwhite}`, text: `${linuxTerminalColors.reset}${linuxTerminalColors.fgred}`},
    SQL: {date: `${linuxTerminalColors.bgyellow}${linuxTerminalColors.fgblack}`, text: `${linuxTerminalColors.reset}${linuxTerminalColors.fgyellow}`},
};

const logLevelUnicodeMapping: {[key: string]: string} = {
    NOTE: "N",
    INFO: "i",
    WEBINFO: "🌐",
    ERROR: "E",
    WARN: "!",
    CRITICAL: "🚨",
    SQL: "🔎",
};

/**
 * Logs all console.log calls into the console as a formatted string.
 */
export default class ConsoleLogger implements ILogger {
    // For now we only support linux
    prettyPrint: boolean = process.platform === "linux";

    constructor(prettyPrint: boolean = false) {
        this.prettyPrint = prettyPrint ? process.platform === "linux" : false;
    }

    async log(log: ILogEntry): Promise<void> {
        const formatted = this.formatLog(log);

        if(Boolean(LoggerService.oldLog)) {
            LoggerService.oldLog(formatted);
        }
        else {
            console.log(formatted);
        }
    }

    formatLog(log: ILogEntry): string {
        if(this.prettyPrint && Object.keys(logLevelMapping).includes(log.level)) {
            const colors = logLevelMapping[log.level];
            const emoji = logLevelUnicodeMapping[log.level];
            const date = `[${log.date.toISOString()}]`;
            const level = log.level ? ` ${emoji} ` : "";
            const infos = log.infos ? log.infos.map(i => `[${i}]`).join("") : "";
            const message = log.lines.join("\n");
            const objects = Object.entries(log.objects).map(([key, value]) => `[${key}: [${util.inspect(value, {breakLength: Infinity})}]]`).join("");

            let formatted = `${colors.date}${date}${level}${infos}${colors.text} ${message}${objects ? ` @ ${objects}` : ""}${linuxTerminalColors.reset}`;

            if(infos.length === 0 && !message) {
                formatted = level;
            }

            return formatted;
        }

        const date = `[${log.date.toISOString()}]`;
        const level = log.level ? `[${log.level.padStart(8, " ")}]` : "";
        const infos = log.infos ? log.infos.map(i => `[${i}]`).join("") : "";
        const message = log.lines.join("\n");
        const objects = Object.entries(log.objects).map(([key, value]) => `[${key}: [${util.inspect(value, {breakLength: Infinity})}]]`).join("");

        let formatted = `${date}${level}${infos} ${message}${objects ? ` @ ${objects}` : ""}`;

        if(infos.length === 0 && !message) {
            formatted = level;
        }

        return formatted;
    }
}
