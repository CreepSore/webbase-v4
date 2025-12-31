import * as fs from "fs";
import * as path from "path";
import ConfigLoader from "../src/logic/config/ConfigLoader";

class TestModel {
    hello: string;
    num: number;
    obj: {a: any, b: any};
    array: string[];
}

const testModel: TestModel = {
    hello: "world",
    num: 1234,
    obj: {
        a: 4,
        b: 999,
    },
    array: ["Hello", "World"],
};

jest.mock("fs");

describe("ConfigLoader Static Tests", () => {
    it("should construct the config path correctly", () => {
        const constructed = ConfigLoader.createConfigPath("Test.json");
        expect(constructed).toBe(path.resolve(".", "cfg", "Test.json"));
    });

    it("should import and parse the config correctly", () => {
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(testModel, null, 2));

        const imported = ConfigLoader.import("TEST");
        expect(imported).toEqual(testModel);
    });

    it("should return null if the config does not exist", () => {
        (fs.existsSync as jest.Mock).mockReturnValue(false);
        const imported = ConfigLoader.import("TEST");
        expect(imported).toBeNull();
    });

    it("should export the config correctly", () => {
        const testPaths = {exportPath: "/a/b/c.json", exportDir: "/a/b"};
        (fs.existsSync as jest.Mock).mockImplementation((testPath) => {
            if(testPath === testPaths.exportDir) return true;
            if(testPath === testPaths.exportPath) return false;
        });

        (fs.writeFileSync as jest.Mock).mockImplementation((testPath, data) => {
            expect(testPath).toBe(testPaths.exportPath);
            expect(JSON.parse(data)).toEqual(testModel);
        });

        ConfigLoader.exportConfig(testModel, testPaths.exportPath);
    });

    it("should remove old config files", () => {
        const testPaths = {exportPath: "/a/b/c.json", exportDir: "/a/b"};
        (fs.existsSync as jest.Mock).mockImplementation((testPath) => {
            if(testPath === testPaths.exportDir) return true;
            if(testPath === testPaths.exportPath) return true;
        });

        (fs.unlinkSync as jest.Mock).mockImplementation((testPath) => {
            expect(testPath).toBe(testPaths.exportPath);
        });

        ConfigLoader.exportConfig(testModel, testPaths.exportPath);

        expect(fs.unlinkSync).toHaveBeenCalled();
    });

    it("should create the config path if it doesn't exist", () => {
        const testPaths = {exportPath: "/a/b/c.json", exportDir: "/a/b"};
        (fs.existsSync as jest.Mock).mockImplementation((testPath) => {
            if(testPath === testPaths.exportDir) return false;
            if(testPath === testPaths.exportPath) return false;
        });

        (fs.mkdirSync as jest.Mock).mockImplementation((testPath) => {
            expect(testPath).toBe(testPaths.exportDir);
        });

        ConfigLoader.exportConfig(testModel, testPaths.exportPath);

        expect(fs.mkdirSync).toHaveBeenCalled();
    });
});
