import * as fs from "fs";
import * as fsp from "fs/promises";
import * as p from "path";

import IFilesystem from "./IFilesystem";

export default class Filesystem implements IFilesystem {
    exists(path: string): Promise<boolean> {
        return fsp.stat(path)
            .then(() => true)
            .catch(() => false);
    }

    isDirectory(path: string): Promise<boolean> {
        return fsp.stat(path)
            .then(s => s.isDirectory())
            .catch(() => false);
    }

    readDirectory(path: string): Promise<string[]> {
        return fsp.readdir(path);
    }

    readDirectoryRecursive(path: string): Promise<string[]> {
        return this._readDirectoryRecursive(path);
    }

    private async _readDirectoryRecursive(path: string, result: string[] = []): Promise<string[]> {
        for(const fpath of await this.readDirectory(path)) {
            if(this.isDirectory(fpath)) {
                this._readDirectoryRecursive(p.join(path, fpath));
                continue;
            }

            result.push(fpath);
        }

        return result;
    }

    createDirectory(path: string): Promise<boolean> {
        return fsp.mkdir(path, {recursive: true})
            .then(() => true)
            .catch(() => false);
    }

    deleteDirectory(path: string): Promise<boolean> {
        return fsp.unlink(path)
            .then(() => true)
            .catch(() => false);
    }

    readFile(path: string): Promise<Buffer> {
        return fsp.readFile(path)
            .catch(() => null);
    }

    createFile(path: string): Promise<boolean> {
        return this.writeFile(path, Buffer.from(""))
            .then(() => true)
            .catch(() => false);
    }

    writeFile(path: string, data: Buffer): Promise<boolean> {
        return fsp.writeFile(path, new Uint8Array(data.buffer))
            .then(() => true)
            .catch(() => false);
    }

    deleteFile(path: string): Promise<boolean> {
        return fsp.unlink(path)
            .then(() => true)
            .catch(() => false);
    }
}
