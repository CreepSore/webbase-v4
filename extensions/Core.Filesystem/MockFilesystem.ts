import IFilesystem from "./IFilesystem";

class MockDirectory {
    name: string;
    isDirectory: true;
    children: Map<string, MockEntry>;
    parent?: MockDirectory;

    constructor(name: string) {
        this.name = name;
        this.isDirectory = true;
        this.children = new Map();
    }
}

class MockFile {
    name: string;
    isDirectory: false;
    content: Buffer;
    parent?: MockDirectory;

    constructor(name: string, content: Buffer = Buffer.alloc(0)) {
        this.name = name;
        this.isDirectory = false;
        this.content = content;
    }
}

type MockEntry = MockDirectory | MockFile;

export enum MockFilesystemType {
    Windows,
    Posix
}

export default class MockFilesystem implements IFilesystem {
    private static rootNameMapping: Record<MockFilesystemType, string> = {
        [MockFilesystemType.Windows]: "C:\\",
        [MockFilesystemType.Posix]: "",
    }

    private static splitDelimiterMapping: Record<MockFilesystemType, string | RegExp> = {
        [MockFilesystemType.Windows]: /\\\\|\//,
        [MockFilesystemType.Posix]: "/",
    }

    private static joinDelimiterMapping: Record<MockFilesystemType, string> = {
        [MockFilesystemType.Windows]: "\\",
        [MockFilesystemType.Posix]: "/",
    }

    root: MockDirectory;
    type: MockFilesystemType;

    private _cwd: string;

    constructor(type: MockFilesystemType) {
        this.type = type;
        this.root = new MockDirectory(this._getRootName());
        this._cwd = this._getRootName();
    }

    exists(path: string): Promise<boolean> {
        return Promise.resolve(Boolean(this._getEntry(path)));
    }

    isDirectory(path: string): Promise<boolean> {
        return Promise.resolve(this._getEntry(path).isDirectory);
    }

    readDirectory(path: string): Promise<string[]> {
        const dir = this._getDirectory(path);
        if(!dir) {
            return null;
        }

        return Promise.resolve([...dir.children].map(([name]) => name));
    }

    readDirectoryRecursive(path: string): Promise<string[]> {
        if(!this.isDirectory(path)) {
            return null;
        }

        return this._readDirectoryRecursive(path);
    }

    private async _readDirectoryRecursive(path: string, result: string[] = []): Promise<string[]> {
        for(const name of await this.readDirectory(path)) {
            const entryPath = this.joinPath(path, name)
            const entry = this._getEntry(entryPath);

            if(entry.isDirectory) {
                this._readDirectoryRecursive(path, result);
                continue;
            }

            result.push(entryPath);
        }

        return result;
    }

    createDirectory(path: string): Promise<boolean> {
        const split = this.splitPath(path);
        const parentPath = this.joinPath(...split.slice(0, -2));
        const dirName = split[split.length - 1];

        let parent = this._getDirectory(parentPath);
        if(!parent) {
            this.createDirectory(parentPath);
            parent = this._getDirectory(parentPath);
        }

        parent.children.set(dirName, new MockDirectory(dirName));
        return Promise.resolve(true);
    }

    deleteDirectory(path: string): Promise<boolean> {
        const dir = this._getDirectory(path);

        if(!dir || !dir.parent) {
            return Promise.resolve(false);
        }

        dir.parent.children.delete(dir.name);

        return Promise.resolve(true);
    }

    readFile(path: string): Promise<Buffer> {
        const found = this._getFile(path);
        if(!found) {
            return null;
        }

        return Promise.resolve(found.content);
    }

    createFile(path: string): Promise<boolean> {
        const split = this.splitPath(path);
        const parentPath = this.joinPath(...split.slice(0, -2));
        const fileName = split[split.length - 1];

        let parent = this._getDirectory(parentPath);
        if(!parent) {
            return Promise.resolve(false);
        }

        parent.children.set(fileName, new MockFile(fileName));
        return Promise.resolve(true);
    }

    writeFile(path: string, data: Buffer): Promise<boolean> {
        const existing = this._getFile(path);
        if(existing) {
            existing.content = data;
            return Promise.resolve(true);
        }

        const split = this.splitPath(path);
        const parentPath = this.joinPath(...split.slice(0, -2));
        const fileName = split[split.length - 1];

        let parent = this._getDirectory(parentPath);
        if(!parent) {
            return Promise.resolve(false);
        }

        parent.children.set(fileName, new MockFile(fileName, data));
        return Promise.resolve(true);
    }

    deleteFile(path: string): Promise<boolean> {
        const file = this._getFile(path);

        if(!file || !file.parent) {
            return Promise.resolve(false);
        }

        file.parent.children.delete(file.name);

        return Promise.resolve(true);
    }

    private _getFile(path: string): MockFile {
        const found = this._getEntry(this._normalizePath(path));

        if(!found || found.isDirectory) {
            return null;
        }

        return found as MockFile;
    }

    private _getDirectory(path: string): MockDirectory {
        const found = this._getEntry(this._normalizePath(path));

        if(!found || !found.isDirectory) {
            return null;
        }

        return found;
    }

    private _getEntry(path: string): MockEntry {
        const split = this.splitPath(this._normalizePath(path));

        let current: MockEntry = this.root;

        for(let i = 0; i < split.length; i++) {
            const segment = split[i];

            if(!segment && segment !== "") {
                return;
            }

            let next = this.root.children.get(segment);

            if(!next) {
                return null;
            }

            if(!next.isDirectory) {
                if(i === split.length - 1) {
                    return next;
                }

                return null;
            }

            current = next;
        }
        return current;
    }

    splitPath(path: string): string[] {
        return path.split(this._getSplitDelimiter());
    }

    joinPath(...segments: string[]): string {
        return segments.join(this._getJoinDelimiter());
    }

    resolvePath(path: string): string {
        if(this.isAbsolutePath(path)) {
            return path;
        }

        const result = this.splitPath(this._cwd);

        for(const segment of this.splitPath(path)) {
            if(segment === ".") {
                // nothing
            }
            else if(segment === "..") {
                result.splice(result.length - 1, 1);
            }
            else {
                result.push(segment);
            }
        }

        return this.joinPath(...result);
    }

    setWorkingDirectory(path: string): void {
        if(this.isAbsolutePath(path)) {
            this._cwd = path;
            return;
        }

    }

    isAbsolutePath(path: string): boolean {
        switch(this.type) {
            case MockFilesystemType.Posix: return path.startsWith("/");
            case MockFilesystemType.Windows: return /^[A-Z]:\\/.test(path);

            default: return false;
        }
    }

    private _normalizePath(path: string): string {
        let result: string = this.resolvePath(path);
        
        if(this.isAbsolutePath(result)) {
            const spliced = this.splitPath(result);
            spliced.splice(0, 1);
            result = this.joinPath(...spliced);
        }

        return result;
    }

    private _getRootName(): string {
        return MockFilesystem.rootNameMapping[this.type];
    }

    private _getSplitDelimiter(): string | RegExp {
        return MockFilesystem.splitDelimiterMapping[this.type];
    }

    private _getJoinDelimiter(): string {
        return MockFilesystem.joinDelimiterMapping[this.type];
    }
}