import * as fs from "fs";
import * as path from "path";
import ConfigLoader from "../src/logic/config/ConfigLoader";

class TestModel {
    hello: string;
    num: number;
    obj: {a: any, b: any};
    array: string[];
}

let testModel: TestModel = {
    hello: "world",
    num: 1234,
    obj: {
        a: 4,
        b: 999
    }  ,
    array: ["Hello", "World"]
};

jest.mock("fs");

describe("ConfigLoader Static Tests", () => {
    
    it("should construct the config path correctly", () => {
        let constructed = ConfigLoader.createConfigPath("Test.json");
        expect(constructed).toBe(path.resolve(".", "cfg", "Test.json"));
    });

    it("should import and parse the config correctly", () => {
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(testModel, null, 2));
        
        let imported = ConfigLoader.import("TEST");
        expect(imported).toEqual(testModel);
    });

    it("should return null if the config does not exist", () => {
        (fs.existsSync as jest.Mock).mockReturnValue(false);
        let imported = ConfigLoader.import("TEST");
        expect(imported).toBeNull();
    });

    it("should export the config correctly", () => {
        const testPaths = {exportPath: "/a/b/c.json", exportDir: "/a/b"};
        (fs.existsSync as jest.Mock).mockImplementation((path) => {
            if(path === testPaths.exportDir) return true;
            if(path === testPaths.exportPath) return false;
        });

        (fs.writeFileSync as jest.Mock).mockImplementation((path, data) => {
            expect(path).toBe(testPaths.exportPath);
            expect(JSON.parse(data)).toEqual(testModel);
        });

        ConfigLoader.exportConfig(testModel, testPaths.exportPath);
    });

    it("should remove old config files", () => {
        const testPaths = {exportPath: "/a/b/c.json", exportDir: "/a/b"};
        (fs.existsSync as jest.Mock).mockImplementation((path) => {
            if(path === testPaths.exportDir) return true;
            if(path === testPaths.exportPath) return true;
        });

        (fs.unlinkSync as jest.Mock).mockImplementation((path) => {
            expect(path).toBe(testPaths.exportPath);
        });

        ConfigLoader.exportConfig(testModel, testPaths.exportPath);

        expect(fs.unlinkSync).toBeCalled();
    });

    it("should create the config path if it doesn't exist", () => {
        const testPaths = {exportPath: "/a/b/c.json", exportDir: "/a/b"};
        (fs.existsSync as jest.Mock).mockImplementation((path) => {
            if(path === testPaths.exportDir) return false;
            if(path === testPaths.exportPath) return false;
        });

        (fs.mkdirSync as jest.Mock).mockImplementation((path) => {
            expect(path).toBe(testPaths.exportDir);
        });

        ConfigLoader.exportConfig(testModel, testPaths.exportPath);

        expect(fs.mkdirSync).toBeCalled();
    });
});
