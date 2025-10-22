import IFilesystem from "../IFilesystem";
import MockFilesystem, { MockFilesystemType } from "../MockFilesystem";

describe("MockFilesystem Tests", () => {
    it.skip("should handle file functions correctly", async() => {
        const types = [MockFilesystemType.Posix, MockFilesystemType.Windows];

        for(const type of types) {
            const fs: IFilesystem = new MockFilesystem(type);

            expect(await fs.exists("./test.log")).toBeFalsy();
            await fs.createFile("./test.log");
            expect(await fs.exists("./test.log")).toBeTruthy();
        }
    });
});

