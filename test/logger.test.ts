import LoggerService from "../src/service/logger/LoggerService";

describe("Logger Tests", () => {
    it("should correctly hook console.log", () => {
        let consoleLog = console.log;
        LoggerService.hookConsoleLog();

        expect(console.log).not.toBe(consoleLog);
        LoggerService.unhookConsoleLog();
        expect(console.log).toBe(consoleLog);
    });

    it("should not destroy the original console.log when unhooking when not hooked", () => {
        let consoleLog = console.log;
        LoggerService.unhookConsoleLog();

        expect(consoleLog).toBe(console.log);
    });

    it("should correctly add a logger and log data", () => {
        const testData = {
            level: "INFO",
            args: [
                "Test",
                {a: 1, b: "test"}
            ]
        }

        const log: {level: string, data: any[]}[] = [];
        LoggerService.addLogger({
            name: "TestLogger",
            async log(level, ...args) {
                log.push({level, data: args});
            }
        });

        LoggerService.log(testData.level, ...testData.args);
        
        expect(log.length).toBe(1);
        let logEntry = log[0];

        expect(logEntry.level).toBe(testData.level);
        expect(logEntry.data).toStrictEqual(testData.args);
    });
});