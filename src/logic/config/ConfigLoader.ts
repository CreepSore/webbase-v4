import * as fs from "fs";
import * as path from "path";
import ConfigModel from "./ConfigModel";

export default class ConfigLoader<T> {
    configPath: string;
    templatePath: string;

    constructor(configPath: string, templatePath: string) {
        this.configPath = configPath;
        this.templatePath = templatePath;
    }

    createTemplateAndImport(model: Partial<T>) {
        this.exportConfigTemplate(model);
        return this.import();
    }

    import() {
        return ConfigLoader.import<T>(this.configPath);
    }

    configExists() {
        return fs.existsSync(this.configPath);
    }

    templateExists() {
        return fs.existsSync(this.templatePath);
    }

    exportConfigTemplate(config: Partial<T>) {
        ConfigLoader.exportConfig(config, this.templatePath);
    }

    static import<T>(path: string) {
        if(!fs.existsSync(path)) return null;
        let config: T = JSON.parse(fs.readFileSync(path, { encoding: "utf8" }));

        return config;
    }

    static exportConfig<T>(config: Partial<T>, exportPath: string) {
        if(fs.existsSync(exportPath)) {
            fs.unlinkSync(exportPath);
        }
        if(!fs.existsSync(path.dirname(exportPath))) {
            fs.mkdirSync(path.dirname(exportPath), {recursive: true});
        }

        fs.writeFileSync(exportPath, JSON.stringify(config, null, 4), { encoding: "utf8" });
    }

    static createConfigPath(configName: string) {
        return path.resolve(".", "cfg", configName);
    }
}
