import * as fs from "fs";
import * as fsp from "fs/promises";
import * as path from "path";

import IExtensionService from "../IExtensionService";
import IExtensionEnvironment from "./IExtensionEnvironment";
import IExtension, { IExtensionConstructor } from "../IExtension";

export default class DirectoryExtensionEnvironment implements IExtensionEnvironment {
    private _path: string;
    private _extensions: Set<IExtension> = new Set();
    onLoadError: (name: string, error: Error) => void;

    constructor(dirPath: string) {
        this._path = path.resolve(dirPath);
    }

    async initialize(): Promise<void> {
        const baseDir = await fsp.readdir(this._path);
        const disabled = await this.getDisabledExtensionDirectoryNames();

        const toAwait: Array<Promise<IExtension | null>> = [];
        for(const subDir of baseDir) {
            if(disabled.has(subDir)) {
                continue;
            }


            toAwait.push(new Promise(async(res, rej) => {
                try {
                    const ExtensionConstructor: IExtensionConstructor = (await import("wpextensions/" + subDir + "/index.ts")).default;
                    const instance = new ExtensionConstructor();
                    instance.metadata.extensionPath = path.resolve(this._path, subDir);
                    res(instance);
                }
                catch(err) {
                    if(this.onLoadError && err.code !== "MODULE_NOT_FOUND") {
                        this.onLoadError(subDir, err as Error);
                    }

                    res(null);
                }
            }));
        }

        const instances = await Promise.all(toAwait);
        instances.forEach(instance => instance && this._extensions.add(instance));
    }

    applyTo(extensionService: IExtensionService): Promise<void> {
        const iterator = this._extensions.values();
        let currentEntry: IteratorResult<IExtension, IExtension>;

        do {
            currentEntry = iterator.next();
            if(currentEntry.done) {
                return null;
            }

            extensionService.registerExtension(currentEntry.value);
        } while(true);
    }

    private async getDisabledExtensionDirectoryNames(): Promise<Set<string>> {
        const result = new Set<string>();
        result.add("Custom.Template");

        try {
            const disabledList: string[] = JSON.parse(await fsp.readFile(path.resolve(this._path, "disabled.json"), "utf-8"));
            disabledList.forEach(entry => result.add(entry));
            return result;
        }
        catch {
            return result;
        }
    }
}
