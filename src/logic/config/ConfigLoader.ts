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
     * Exports the specified model as template
     * @param config
     */
    exportConfig(config: Partial<T>): void {
        ConfigLoader.exportConfig(config, this.configPath);
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
        if(!fs.existsSync(path.dirname(exportPath))) {
            fs.mkdirSync(path.dirname(exportPath), {recursive: true});
        }

        if(fs.existsSync(exportPath)) {
            try {
                fs.unlinkSync(exportPath);
            }
            catch {
                // i could not care less
            }
        }

        fs.writeFileSync(exportPath, JSON.stringify(config, null, 4), { encoding: "utf8" });
    }

    static createConfigPath(configName: string): string {
        if(process.env.CFG_PATH) {
            return path.resolve(process.env.CFG_PATH, configName);
        }

        return path.resolve(".", "cfg", configName);
    }

    static createTemplateConfigPath(configName: string): string {
        if(process.env.CFG_PATH_TEMPLATE) {
            return path.resolve(process.env.CFG_PATH_TEMPLATE, "template", configName);
        }

        return path.resolve(".", "cfg", "template", configName);
    }

    static initConfigWithModel<T>(
        configPath: string,
        templatePath: string,
        defaultModel: T,
        createDefault: boolean = false,
    ): T {
        if(Object.keys(defaultModel).length === 0) return defaultModel;

        const configLoader = new ConfigLoader(configPath, templatePath);
        if(!configLoader.configExists() && createDefault) {
            configLoader.exportConfig(defaultModel);
        }

        const cfg = configLoader.createTemplateAndImport(defaultModel);
        return cfg as T;
    }

    static environmentOverride<T>(cfg: T, baseKey: string = ""): T {
        if(process.env.ENABLE_CONFIG_OVERRIDE !== "true") {
            return cfg;
        }

        // ! This looks like i am insane, but we can do this since our configs are
        // ! guaranteed to always be json only without any functions
        const copy = JSON.parse(JSON.stringify(cfg));

        Object.entries(process.env)
            .filter(([key]) => !baseKey || key.startsWith(baseKey))
            .forEach(([key, value]) => {
                const parts = key.split("_");
                if(baseKey) {
                    parts.splice(0, 1);
                }

                let currentObj: any = copy;
                for(let i = 0; i < parts.length - 1; i++) {
                    currentObj = currentObj[parts[i]];
                }

                currentObj[parts[parts.length - 1]] = value;
            });

        return copy;
    }
}
