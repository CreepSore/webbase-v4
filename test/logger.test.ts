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
        LoggerService.hookConsoleLog();
        LoggerService.unhookConsoleLog();

        expect(consoleLog).toBe(console.log);
    });

    it("should correctly use the property descriptor", () => {
        LoggerService.hookConsoleLog();
        const log: ILogEntry[] = [];
        LoggerService.addLogger({
            name: "TestLogger",
            async log(logEntry: ILogEntry) {
                log.push(logEntry);
            },
        });

        class DecoratorTest {
            @LogBuilder.$logRuntime("always")
            test1(): string {
                return "test";
            }

            @LogBuilder.$logRuntime()
            test2(): string {
                return "test2";
            }
        }

        const test = new DecoratorTest();
        const result1 = test.test1();
        const logEntry = log[0];
        expect(logEntry).toBeInstanceOf(Object);
        expect(Object.keys(logEntry.objects).length).toBe(1);
        expect(logEntry.lines).toContain("Got called");
        expect(logEntry.lines).toContain("Call-Stack:");
        expect(result1).toBe("test");

        const result2 = test.test2();
        const logEntry2 = log[1];
        expect(logEntry2).toBeInstanceOf(Object);
        expect(Object.keys(logEntry2.objects).length).toBe(1);
        expect(logEntry2.lines).not.toContain("Call-Stack:");
        expect(result2).toBe("test2");
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
