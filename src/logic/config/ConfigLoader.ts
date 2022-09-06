import * as fs from "fs";
import ConfigModel from "./ConfigModel";

export default class ConfigLoader {
    configPath: string;
    templatePath: string;

    constructor(configPath: string, templatePath: string) {
        this.configPath = configPath;
        this.templatePath = templatePath;
    }

    import() {
        return ConfigLoader.import(this.configPath);
    }

    exportDefault() {
        ConfigLoader.exportDefault(this.templatePath);
    }

    configExists() {
        return fs.existsSync(this.configPath);
    }

    templateExists() {
        return fs.existsSync(this.templatePath);
    }

    static import(path: string) {
        if(!fs.existsSync(path)) return null;
        let config: ConfigModel = JSON.parse(fs.readFileSync(path, { encoding: "utf8" }));

        return config;
    }

    static exportDefault(path: string) {
        if(fs.existsSync(path)) {
            fs.unlinkSync(path);
        }

        fs.writeFileSync(path, JSON.stringify(new ConfigModel(), null, 4), { encoding: "utf8" });
    }
}
