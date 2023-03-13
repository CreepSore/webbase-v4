import * as fs from "fs";
import * as path from "path";

/**
 * Loads configurations from JSON files.
 *
 * @template T Config Model Type
 */
export default class ConfigLoader<T> {
    configPath: string;
    templatePath: string;

    /**
     * Creates an instance of ConfigLoader.
     * @param {string} configPath absolute path to the main config file
     * @param {string} templatePath absolute path to the template file
     */
    constructor(configPath: string, templatePath: string) {
        this.configPath = configPath;
        this.templatePath = templatePath;
    }

    /**
     * Creates a new template from the specified model
     * and imports the configuration that already exist.
     *
     * @param {Partial<T>} model
     */
    createTemplateAndImport(model: Partial<T>): T {
        this.exportConfigTemplate(model);
        return this.import();
    }

    /**
     * Imports a ConfigModel from {@link ConfigLoader.configPath}
     */
    import(): T {
        return ConfigLoader.import<T>(this.configPath);
    }

    /**
     * Checks if the config exists
     */
    configExists(): boolean {
        return fs.existsSync(this.configPath);
    }

    /**
     * Checks if the template exists
     */
    templateExists(): boolean {
        return fs.existsSync(this.templatePath);
    }

    /**
     * Exports the specified model as template
     * @param config
     */
    exportConfigTemplate(config: Partial<T>): void {
        ConfigLoader.exportConfig(config, this.templatePath);
    }

    /**
     * Imports a file as a ConfigModel from the specified path
     * @param importPath file to import
     */
    static import<T>(importPath: string): T {
        if(!fs.existsSync(importPath)) return null;
        const config: T = JSON.parse(fs.readFileSync(importPath, { encoding: "utf8" }));

        return config;
    }

    /**
     * Exports a ConfigModel to the specified path
     * @param config the ConfigModel to export
     * @param exportPath the export path
     */
    static exportConfig<T>(config: Partial<T>, exportPath: string): void {
        if(fs.existsSync(exportPath)) {
            fs.unlinkSync(exportPath);
        }
        if(!fs.existsSync(path.dirname(exportPath))) {
            fs.mkdirSync(path.dirname(exportPath), {recursive: true});
        }

        fs.writeFileSync(exportPath, JSON.stringify(config, null, 4), { encoding: "utf8" });
    }

    static createConfigPath(configName: string): string {
        return path.resolve(".", "cfg", configName);
    }
}
