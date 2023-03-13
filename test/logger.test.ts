import ILogEntry from "../src/service/logger/ILogEntry";
import LogBuilder from "../src/service/logger/LogBuilder";
import LoggerService from "../src/service/logger/LoggerService";

describe("Logger Tests", () => {
    it("should correctly hook console.log", () => {
        const consoleLog = console.log;
        LoggerService.hookConsoleLog();

        expect(console.log).not.toBe(consoleLog);
        LoggerService.unhookConsoleLog();
        expect(console.log).toBe(consoleLog);
    });

    it("should not destroy the original console.log when unhooking when not hooked", () => {
        const consoleLog = console.log;
        LoggerService.unhookConsoleLog();

        expect(consoleLog).toBe(console.log);
    });

    it("should correctly add a logger and log data", () => {
        const testData: ILogEntry = {
            id: "",
            date: new Date(),
            level: "INFO",
            infos: ["TestInfo"],
            lines: ["Test1", "Test2"],
            objects: {testObj: {a: 1, b: "2"}},
        };

        const log: ILogEntry[] = [];
        LoggerService.addLogger({
            name: "TestLogger",
            async log(logEntry: ILogEntry) {
                log.push(logEntry);
            },
        });

        LoggerService.hookConsoleLog();

        const builder = LogBuilder
            .start()
            .level(testData.level as string)
            .object("testObj", testData.objects.testObj)
            .object("nullObj", null);

        testData.lines.forEach(line => builder.line(line));
        testData.infos.forEach(info => builder.info(info));

        builder.done();

        expect(log.length).toBe(1);
        const logEntry = log[0];

        expect(logEntry.level).toBe(testData.level);
        expect(Object.entries(logEntry.objects).length).toBe(Object.entries(testData.objects).length);
        Object.entries(testData.objects).forEach(([key, value]) => expect(logEntry.objects[key]).toEqual(value));
        testData.lines.forEach(line => expect(logEntry.lines).toContain(line));
        testData.infos.forEach(info => expect(logEntry.infos).toContain(info));
    });

    it("should log correctly using hooked console.log", () => {
        const testData: ILogEntry = {
            id: "",
            date: new Date(),
            level: "INFO",
            infos: ["TestInfo", "TestInfo2"],
            lines: ["Test1"],
            objects: {},
        };

        LoggerService.hookConsoleLog();

        const log: ILogEntry[] = [];
        LoggerService.addLogger({
            name: "TestLogger",
            async log(logEntry: ILogEntry) {
                log.push(logEntry);
            },
        });

        console.log(testData.level, ...testData.infos, ...testData.lines);

        expect(log.length).toBe(1);
        const logEntry = log[0];

        expect(logEntry.level).toBe(testData.level);
        testData.lines.forEach(line => expect(logEntry.lines).toContain(line));
        testData.infos.forEach(info => expect(logEntry.infos).toContain(info));
    });
});
