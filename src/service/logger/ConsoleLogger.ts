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
    bgwhite: "\x1b[47m"
};

const logLevelMapping: {[key: string]: {date: string, text: string}} = {
    INFO: {date: `${linuxTerminalColors.bgblue}${linuxTerminalColors.fgwhite}`, text: `${linuxTerminalColors.reset}${linuxTerminalColors.fgblue}`},
    WEBINFO: {date: `${linuxTerminalColors.bgblue}${linuxTerminalColors.fgwhite}`, text: `${linuxTerminalColors.reset}${linuxTerminalColors.fgblue}`},
    ERROR: {date: `${linuxTerminalColors.bgred}${linuxTerminalColors.fgwhite}`, text: `${linuxTerminalColors.reset}${linuxTerminalColors.fgred}`},
    WARN: {date: `${linuxTerminalColors.bgyellow}${linuxTerminalColors.fgblack}`, text: `${linuxTerminalColors.reset}${linuxTerminalColors.fgyellow}`},
    CRITICAL: {date: `${linuxTerminalColors.bgred}${linuxTerminalColors.fgwhite}`, text: `${linuxTerminalColors.reset}${linuxTerminalColors.fgred}`},
    SQL: {date: `${linuxTerminalColors.bgyellow}${linuxTerminalColors.fgblack}`, text: `${linuxTerminalColors.reset}${linuxTerminalColors.fgyellow}`}
};

const logLevelUnicodeMapping: {[key: string]: string} = {
    INFO: "i",
    WEBINFO: "🌐",
    ERROR: "E",
    WARN: "!",
    CRITICAL: "🚨",
    SQL: "🔎"
};

/**
 * Logs all console.log calls into the console as a formatted string.
 */
export default class ConsoleLogger implements ILogger {
    // For now we only support linux
    fancy: boolean = process.platform === "linux";

    async log(log: ILogEntry) {
        const formatted = this.formatLog(log);

        if(Boolean(LoggerService.oldLog)) {
            LoggerService.oldLog(formatted);
        }
        else {
            console.log(formatted);
        }
    }

    formatLog(log: ILogEntry) {
        if(this.fancy && Object.keys(logLevelMapping).includes(log.level)) {
            let colors = logLevelMapping[log.level];
            let emoji = logLevelUnicodeMapping[log.level];
            let date = `[${log.date.toISOString()}]`;
            let level = log.level ? ` ${emoji} ` : "";
            let infos = log.infos ? log.infos.map(i => `[${i}]`).join("") : "";
            let message = log.lines.join("\n");
            let objects = Object.entries(log.objects).map(([key, value]) => `[${key}: [${util.inspect(value, {breakLength: Infinity})}]]`).join("");

            let formatted = `${colors.date}${date}${level}${infos}${colors.text} ${message}${objects ? ` @ ${objects}` : ""}`;

            if(infos.length === 0 && !message) {
                formatted = level;
            }

            return formatted;
        }
        else {
            let date = `[${log.date.toISOString()}]`;
            let level = log.level ? `[${log.level.padStart(8, " ")}]` : "";
            let infos = log.infos ? log.infos.map(i => `[${i}]`).join("") : "";
            let message = log.lines.join("\n");
            let objects = Object.entries(log.objects).map(([key, value]) => `[${key}: [${util.inspect(value, {breakLength: Infinity})}]]`).join("");

            let formatted = `${date}${level}${infos} ${message}${objects ? ` @ ${objects}` : ""}`;

            if(infos.length === 0 && !message) {
                formatted = level;
            }

            return formatted;
        }

    }
}
