import EnvironmentFileParser from "./EnvironmentFileParser";

export default class EnvironmentFile {
    identifier: string;
    private environmentVariableMapping: Map<string, string[]> = new Map();

    addMapping(name: string, value: string): this {
        let mappingObject = this.environmentVariableMapping.get(name);

        if(!mappingObject) {
            mappingObject = [value];
            this.environmentVariableMapping.set(name, mappingObject);
            return this;
        }

        mappingObject.push(value);
        return this;
    }

    getMapping(name: string): string {
        const values = this.environmentVariableMapping.get(name);
        if(!values) {
            return null;
        }

        return values[values.length - 1];
    }

    /**
     * Applies this environment file to the process.env object
     */
    apply() {
        for(let [key, value] of this.environmentVariableMapping.entries()) {
            // ! Skip already set environment variables
            if(process.env[key]) {
                continue;
            }

            process.env[key] = value[value.length - 1];
        }
    }

    static parse(buffer: Buffer, identifier?: string): EnvironmentFile {
        const result = new EnvironmentFileParser(buffer).parse();
        result.identifier = identifier;

        return result;
    }
}
