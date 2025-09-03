

export default interface IFilesystem {
    exists(path: string): Promise<boolean>;
    isDirectory(path: string): Promise<boolean>;

    readDirectory(path: string): Promise<string[]>;
    readDirectoryRecursive(path: string): Promise<string[]>;
    createDirectory(path: string): Promise<boolean>;
    deleteDirectory(path: string): Promise<boolean>;

    readFile(path: string): Promise<Buffer>;
    createFile(path: string): Promise<boolean>;
    writeFile(path: string, data: Buffer): Promise<boolean>;
    deleteFile(path: string): Promise<boolean>;

    resolvePath(path: string): string;
    joinPath(...segments: string[]): string;
    splitPath(path: string): string[];
    isAbsolutePath(path: string): boolean;

    setWorkingDirectory(path: string): void;
}
