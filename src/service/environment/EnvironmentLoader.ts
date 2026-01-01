import * as fs from "fs";
import * as fsp from "fs/promises";
import * as path from "path";
import EnvironmentFile from "./EnvironmentFile";
import EnvironmentFiles from "./EnvironmentFiles";

type LoadEnvironmentFromDirectoryResult = {
    errors: Error[];
    files: EnvironmentFiles;
}

export class EnvironmentLoader {
    /**
     * Loads and parses an .env file from the given path
     * @throws This will throw if the file does not exist.
     */
    static loadFromFile(filePath: string): EnvironmentFile {
        return EnvironmentFile.parse(fs.readFileSync(filePath), filePath);
    }

    /**
     * Loads and parses an .env file from the given path
     * @throws This will throw if the file does not exist.
     */
    static loadFromFileAsync(filePath: string): Promise<EnvironmentFile> {
        return fsp.readFile(filePath).then(b => EnvironmentFile.parse(b, filePath));
    }

    static loadFromDirectory(dirPath: string, recursive: boolean = false): LoadEnvironmentFromDirectoryResult {
        const result: LoadEnvironmentFromDirectoryResult = {
            errors: [],
            files: new EnvironmentFiles()
        };
        for(let file of fs.readdirSync(dirPath)) {
            const absolutePath = path.resolve(dirPath, file);
            const stat = fs.statSync(absolutePath);

            if(stat.isDirectory()) {
                if(recursive) {
                    const recursedResult = this.loadFromDirectory(absolutePath, recursive);
                    result.files.push(...recursedResult.files);
                    result.errors.push(...recursedResult.errors);
                }

                continue;
            }

            if(file.endsWith(".env")) {
                try {
                    result.files.push(this.loadFromFile(absolutePath));
                }
                catch(err) {
                    result.errors.push(new Error(`Failed to load .env file [${absolutePath}]: ${err}`));
                }
            }
        }

        return result;
    }

    static async loadFromDirectoryAsync(dirPath: string, recursive: boolean = false): Promise<LoadEnvironmentFromDirectoryResult> {
        const result: LoadEnvironmentFromDirectoryResult = {
            errors: [],
            files: new EnvironmentFiles()
        };

        for await(let file of await fsp.readdir(dirPath)) {
            const absolutePath = path.resolve(dirPath, file);
            const stat = await fsp.stat(absolutePath);

            if(stat.isDirectory()) {
                if(recursive) {
                    const recursedResult = await this.loadFromDirectoryAsync(absolutePath, recursive);
                    result.files.push(...recursedResult.files);
                    result.errors.push(...recursedResult.errors);
                }

                continue;
            }

            if(file.endsWith(".env")) {
                try {
                    result.files.push(await this.loadFromFileAsync(absolutePath));
                }
                catch(err) {
                    result.errors.push(new Error(`Failed to load .env file [${absolutePath}]: ${err}`));
                }
            }
        }

        return result;
    }
}